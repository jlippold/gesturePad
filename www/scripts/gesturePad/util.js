var util = {
	showingHud: false,
	doHud: function(o) {
		if (util.showingHud && o.show) {
			return; //hud is already displayed, break the fuck out
		}
		var hud = window.plugins.progressHud;
		if (o.show) {
			util.showingHud = true;
			hud.show({
				mode: "indeterminate",
				labelText: o.labelText,
				detailsLabelText: o.detailsLabelText
			}, function() {}, (o.tappedEvent) ? o.tappedEvent : function() {});
		} else {
			util.showingHud = false;
			hud.hide();
		}
	},
	compare: function(a, b) {
		if (a.catIndex < b.catIndex)
			return -1;
		if (a.catIndex > b.catIndex)
			return 1;
		return 0;
	},
	isNumeric: function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	detectOrientation: function() {
		if (typeof window.onorientationchange != 'undefined') {
			util.doResize();
		}
	},
	setSwipeThresholds: function() {
		if (deviceType == "tablet") {
			HorzLongSwipeThreshold = $("#gestures_canvas").width() * 0.5;
			VertLongSwipeThreshold = $("#gestures_canvas").height() * 0.5;
		}
		if (deviceType == "phone") {
			HorzLongSwipeThreshold = $("#gestures_canvas").width() * 0.8;
			VertLongSwipeThreshold = $("#gestures_canvas").height() * 0.7;
		}
	},
	doResize: function() {
		$("#card").height($("body").height() - ($("#top").outerHeight() + ($("#bottom").outerHeight() / 3.5)));
		var h = $("#container").height() - ($("#top").outerHeight() + $("#bottom").outerHeight() + $("div.toptrans").outerHeight() - 1);
		var w = $("body").width();
		$("#gestures_canvas").attr("height", h);
		$("#gestures_canvas").attr("width", w);
		$("#gestures_canvas").height(h);
		$("#gestures_canvas").width(w);
		sliders.resize();
		sliders.resetVolumeSlider();
		sliders.resetNPSeek();
		setTimeout(function() {
			util.setSwipeThresholds();
		}, 1500);
	},
	executeObjC: function(url) {
		var iframe = document.createElement("IFRAME");
		iframe.setAttribute("src", url);
		document.documentElement.appendChild(iframe);
		iframe.parentNode.removeChild(iframe);
		iframe = null;
	},
	htmlEscape: function(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	},
	splash: function(t) {
		try {
			if (t == "hide") {
				navigator.splashscreen.hide();
			} else {
				navigator.splashscreen.show();
			}
		} catch (e) {}
	},
	setStatusBarMessage: function(text) {
		console.log(text);
		util.setStatusBarForceClear();
		var statusBar = window.plugins.CDVStatusBarOverlay;
		// Send a message to the statusbar
		statusBar.setStatusBar({
			"message": text,
			"animation": "Shrink",
			"showSpinner": true
		});

	},
	setStatusBarForceClear: function() {
		var statusBar = window.plugins.CDVStatusBarOverlay;
		statusBar.clearStatusBar();
	},
	getEGBaseUrl: function() {
		var room = util.getCurrentRoom();
		var devices = room.devices;
		for (var i = 0; i < devices.length; i++) {
			if (devices[i].shortname == "MCE") {
				return "http://" + devices[i].IPAddress + ":" + devices[i].Port + "/";
			}
		}
		return "";
	},
	getRandomMBServer: function() {
		var MBArray = [];
		var MBUrl = "";
		for (var x = 0; x < settings.userSettings.rooms.length; x++) {
			devices = settings.userSettings.rooms[x].devices;
			for (var i = 0; i < devices.length; i++) {
				if (devices[i].shortname == "MCE") {
					MBArray.push("http://" + devices[i].IPAddress + ":" + devices[i].ServicePort + "/mbwebapi/service/");
				}
			}
		}
		return MBArray[Math.floor(Math.random() * MBArray.length)];
	},
	getFirstMBServer: function() {
		var MBUrl = "";
		for (var x = 0; x < settings.userSettings.rooms.length; x++) {
			devices = settings.userSettings.rooms[x].devices;
			for (var i = 0; i < devices.length; i++) {
				if (devices[i].shortname == "MCE") {
					MBUrl = "http://" + devices[i].IPAddress + ":" + devices[i].ServicePort + "/mbwebapi/service/";
					break;
				}
			}
			if (MBUrl !== "") {
				break;
			}
		}
		return MBUrl;
	},
	getMBUrl: function() {
		var room = util.getCurrentRoom();
		var devices = room.devices;
		for (var i = 0; i < devices.length; i++) {
			if (devices[i].shortname == "MCE") {
				return "http://" + devices[i].IPAddress + ":" + devices[i].ServicePort + "/mbwebapi/service/";
			}
		}
		return "";
	},
	getCurrentDevice: function() {
		if (settings.userSettings.rooms) {
			if (settings.userSettings.rooms.length > 0) {
				if (settings.userSettings.rooms[settings.userSettings.roomIndex].devices.length > 0) {
					return settings.userSettings.rooms[settings.userSettings.roomIndex].devices[settings.userSettings.deviceIndex];
				} else {
					return null;
				}
			} else {
				return null;
			}
		}
	},
	getCurrentRoom: function() {
		return settings.userSettings.rooms[settings.userSettings.roomIndex];
	},
	getDeviceByShortName: function(shortname) {
		var room = util.getCurrentRoom();
		for (var i = 0; i < room.devices.length; i++) {
			if (room.devices[i].shortname == shortname) {
				return room.devices[i];
			}
		}
		return null;
	},
	setDeviceByShortName: function(shortname) {
		var room = util.getCurrentRoom();
		for (var i = 0; i < room.devices.length; i++) {
			if (room.devices[i].shortname == shortname) {
				settings.userSettings.deviceIndex = i;
				return true;
			}
		}
		return false;
	},
	getEpochTime: function() {
		var d = new Date();
		return Math.round(d.getTime());
	},
	epochToDateObject: function(n) {
		return new Date(n * 1000);
	},
	getRoomStatus: function() {
		var url = util.getEGBaseUrl();
		$.ajax({
			type: "GET",
			dataType: "text",
			url: url,
			success: function(resp) {
				settings.userSettings.deviceIndex = 0;
				try {
					var obj = jQuery.parseJSON(resp);
					if (obj.device !== "") {
						var newDevice = util.getDeviceByShortName(obj.device);
						settings.userSettings.deviceIndex = newDevice.index;
					}
				} catch (e) {}
				util.updateStatus();
			}
		});
	},
	updateStatus: function() {
		var device = util.getCurrentDevice();
		var room = util.getCurrentRoom();
		$("#txtDevice").text(device.name);
		$("#txtRoom").text(room.name);
		if (room.IR === true) {
			$("#overallVolumeContainer").show();
		} else {
			$("#overallVolumeContainer").hide();
		}
		if ((util.getItem("deviceIndex") != settings.userSettings.deviceIndex) || (util.getItem("roomIndex") != settings.userSettings.roomIndex)) {
			if (util.getItem("deviceIndex") != settings.userSettings.deviceIndex) {
				bottomDraw.updateBottomContents();
			}
			ui.clearNowPlaying();
		}
		setTimeout(function() {
			ui.queryNowPlaying();
		}, 1500);
		util.setItem("deviceIndex", settings.userSettings.deviceIndex);
		util.setItem("roomIndex", settings.userSettings.roomIndex);
	},
	hms2: function(totalSec) {
		if (totalSec <= 0) {
			return "0:00";
		}
		try {
			hours = parseInt(totalSec / 3600, 10) % 24;
			minutes = parseInt(totalSec / 60, 10) % 60;
			seconds = totalSec % 60;
			return (hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
		} catch (e) {
			return "0:00";
		}
	},
	clearCallers: function(force) {
		if (force === false) {
			var endedDivs = $("#gestureCallback div.dofadeout-final");
			$(endedDivs).remove();
		} else {
			$("#gestureCallback div").remove();
		}
	},
	doAlert: function(msg) {
		util.doHud({
			show: false
		});
		try {
			navigator.notification.alert(msg, null, "gesturePad");
		} catch (e) {
			alert(msg);
		}
	},
	isWifi: function() {
		if (settings.userSettings.wifi === false) {
			return true;
		}
		try {
			if (util.netState() == 'WiFi connection') {
				return true;
			} else {
				return false;
			}
		} catch (e) {
			return true;
		}
	},
	netState: function() {
		try {
			var networkState = navigator.connection.type;
			var states = {};
			states[Connection.UNKNOWN] = 'Unknown connection';
			states[Connection.ETHERNET] = 'Ethernet connection';
			states[Connection.WIFI] = 'WiFi connection';
			states[Connection.CELL_2G] = 'Cell 2G connection';
			states[Connection.CELL_3G] = 'Cell 3G connection';
			states[Connection.CELL_4G] = 'Cell 4G connection';
			states[Connection.NONE] = 'No network connection';
			return (states[networkState]);
		} catch (e) {
			return 'WiFi connection';
		}
	},
	setItem: function(key, val) {
		localStorage.setItem(key, val);
	},
	getItem: function(key, defaultVal) {
		try {
			return localStorage.getItem(key);
		} catch (e) {
			if (arguments.length == 2) {
				return defaultVal;
			} else {
				return "";
			}
		}
	},
	reloadPage: function() {
		console.log("reloading");
		util.splash("show");
		window.location.reload();
	},
	playBeep: function() {
		if (settings.userSettings.sounds) {
			try {
				navigator.notification.beep();
			} catch (e) {}
		}
		if (settings.userSettings.vibrate) {
			try {
				navigator.notification.vibrate(1000);
			} catch (e) {}
		}
	},
	dynamicSort: function(property) {
		var sortOrder = 1;
		if (property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1, property.length - 1);
		}
		return function(a, b) {
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		};
	}
};
$.fn.hasAttr = function(name) {
	return this.attr(name) !== undefined;
};
Date.prototype.timeNow = function() {
	var tod = "AM";
	var h = this.getHours();
	if (this.getHours() > 12) {
		tod = "PM";
		h = h - 12;
	}
	if (h === 0) {
		h = 12;
	}
	tod = h + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + " " + tod;
	if (tod == "0:00 AM") {
		return "";
	} else {
		return tod;
	}
};
/* Some old shit to get channel info from DTV json blob 
	$.getJSON('guideChannelList.json', function(data) {
		var out = "<channels>"
		$.each(data.channels, function(i) {
			out += "<channel>"
			out += "<number>" + data.channels[i].chNum + "</number>"
			out += "<callsign><![CDATA[" + data.channels[i].chCall + "]]></callsign>"
			if (data.channels[i].chLogoUrl == null) {
				out += "<logo></logo>"
			} else {
				out += "<logo><![CDATA[img/channels" + data.channels[i].chLogoUrl.substring(data.channels[i].chLogoUrl.lastIndexOf("/")) + "]]></logo>"
			}
			out += "<fullname><![CDATA[" + data.channels[i].chName + "]]></fullname>"
			out += "</channel>"
		});
		out += "</channels>"
		
	});
	return;

	//get list of images
	$.getJSON('guideChannelList.json', function(data) {
		var out = ""
		$.each(data.channels, function(i) {
			if (data.channels[i].chLogoUrl == null) {} else {
				out += "<a href='http://directv.images.cust.footprint.net/" + data.channels[i].chLogoUrl + "'>" + data.channels[i].chLogoUrl.substring(data.channels[i].chLogoUrl.lastIndexOf("/")) + "</a>"
			}
		});
		$("body").html(out)
	});
	return;
*/

/*
try {

} catch (err) {
	var vDebug = "";
	for (var prop in err) {
		vDebug += "property: " + prop + " value: [" + err[prop] + "]\n\n";
	}
	vDebug += "toString(): " + " value: [" + err.toString() + "]\n\n";

	console.log("Error: " + vDebug);
}
*/