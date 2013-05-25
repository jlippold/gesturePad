var DirecTV = {
	changeChannel: function(major) {
		var device = util.getCurrentDevice();
		// change channel
		$.getJSON("http://" + device.IPAddress + ":" + device.Port + '/tv/tune?major=' + major, function() {
			ui.clearNowPlaying();
			// update whats on
			setTimeout(function() {
				ui.queryNowPlaying();
			}, 3000);
		});
	},
	startWorker: function() {
		try {
			clearTimeout(workerTimer);
		} catch (e) {}

		//save all dtv servers to an array
		var dtvServers = [];
		var currentServer = 0;
		//pull all dtv servers for a round-robin guide pull
		for (var i = 0; i < settings.userSettings.rooms.length; i++) {
			for (var x = 0; x < settings.userSettings.rooms[i].devices.length; x++) {
				if (settings.userSettings.rooms[i].devices[x].shortname == "DTV") {
					dtvServers[currentServer] = "http://" + settings.userSettings.rooms[i].devices[x].IPAddress + ":" + settings.userSettings.rooms[i].devices[x].Port + "/";
					$.ajaxq("DTVWorker" + currentServer); //clear the queue
					currentServer += 1;
				}
			}
		}
		currentServer = 0;
		var didRefresh = false;
		$.each(guide.channels, function(channelKey) {
			var c = guide.channels[channelKey];
			//first determine if the channel needs a refresh
			var timeleft = "0:00";
			if (c.startTime > 0 && c.duration > 0) {
				timeleft = util.hms2((c.startTime + c.duration) - Math.floor(new Date().getTime() / 1000));
			}
			if (c.nowplaying === "" || timeleft == "0:00") {
				c.nowplaying = "";
				var blnFoundServer = false;
				while (blnFoundServer === false) {
					//pick a server
					if (currentServer > dtvServers.length - 1) {
						currentServer = 0;
					}
					//queue the refresh on that server
					if (dtvServers[currentServer].room != util.getCurrentDevice().shortname) { //dont overload the current room
						DirecTV.refreshChannel(dtvServers[currentServer], "DTVWorker" + currentServer, channelKey);
						didRefresh = true;
						blnFoundServer = true;
					}
					currentServer += 1;
				}
			}
		});
		if (didRefresh === false) {
			workerTimer = setTimeout(function() {
				DirecTV.startWorker();
			}, 30000);
		}
	},
	setupWorker: function(channellist) {
		//MediaBrowser.startWorker();
		if (DirecTV.hasDirecTV() === false) {
			return;
		}
		guide.channels = [];
		//setup base structures
		var dedupe = "";
		$(channellist).find('channels > channel').each(function() {
			if (dedupe != $(this).find("number").text()) {
				var channel = {};
				channel.number = $(this).find("number").text();
				channel.logo = $(this).find("logo").text();
				channel.callsign = $(this).find("callsign").text();
				channel.nowplaying = "";
				channel.ending = 0;
				channel.timeleft = "";
				channel.fullname = $(this).find("fullname").text();
				channel.startTime = 0;
				channel.duration = 0;
				var fav = $(channellist).find('channels > favorites > category > number').filter(function() {
					return $(this).text() == channel.number;
				});
				if ($(fav).size() > 0) {
					channel.category = $(fav).parent().attr("name");
					channel.catIndex = parseInt($(fav).parent().attr("idx"), 10);
				} else {
					channel.category = "Unsorted";
					channel.catIndex = 999;
				}
				guide.channels.push(channel);
				dedupe = channel.number;
			}
		});
		guide.channels.sort(util.compare);
		DirecTV.startWorker();
	},
	hasDirecTV: function() {
		var retVal = false;
		for (var i = 0; i < settings.userSettings.rooms.length; i++) {
			if (settings.userSettings.rooms[i].DTV !== null) {
				retVal = true;
				break;
			}
		}
		return retVal;
	},
	loadChannelList: function() {
		var xmlLoc = "xml/channellist.xml?r=" + Math.random(); //possibly let this be user defined.
		$.ajax({
			type: "GET",
			url: xmlLoc,
			dataType: "xml",
			success: function(resp) {
				DirecTV.setupWorker(resp);
			},
			error: function() {
				util.doAlert("Error loading channel list: " + xmlLoc);
			}
		});
	},
	refreshChannel: function(server, queueName, channelKey) {
		var c = guide.channels[channelKey];
		$.ajaxq(queueName, {
			url: server + 'tv/getProgInfo',
			dataType: "json",
			type: "GET",
			timeout: 10000,
			data: 'major=' + c.number,
			success: function(response) {
				c.nowplaying = response.title;
				c.startTime = response.startTime;
				c.duration = response.duration;
				c.timeleft = util.hms2((response.startTime + response.duration) - Math.floor(new Date().getTime() / 1000));
				c.ending = (response.startTime + response.duration);
				DirecTV.checkIfWorkerIsComplete();
			},
			error: function(x, y, z) {
				console.log("Refresh Channel " + c.number + " Error " + server);
				//remove it from the queue
				document.ajaxq.q[queueName].shift();
				DirecTV.checkIfWorkerIsComplete();
			}
		});
	},
	checkIfWorkerIsComplete: function() {
		var allComplete = true;
		$.each(document.ajaxq.q, function(i, x) {
			if (document.ajaxq.q[i].length > 1 && i.indexOf("DTVWorker") > -1) {
				allComplete = false;
				//console.log( i + " has " + document.ajaxq.q[i].length + " in queue");
			}
		});
		if (allComplete === true) {
			workerTimer = setTimeout(function() {
				DirecTV.startWorker();
			}, 30000);
		}
	}
};