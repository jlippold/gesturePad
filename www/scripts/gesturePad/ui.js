var ui = {
	screenShotMode: false,
	nowPlaying: {
		url: "",
		navTitle: "gesturePad",
		navSubTitle: "",
		duration: 0
	},
	initiateBindings: function() {
		ui.view = window.plugins.GestureView;
		ui.view.create();
		$("body").bind("touchmove", function(event) {
			event.preventDefault();
		});
		ui.bindButtons();
		//sliders.bindSliders();
		//bottomDraw.bind();

	},
	bindButtons: function() {

		ui.view.bind("rightNavButtonTap", function() {
			window.scrollTo(0, 0);
			var room = util.getCurrentRoom();
			var device = util.getCurrentDevice();
			if (device.shortname == "DTV") {

				var tableView = [];
				var currentChannelIndex = 0;

				$.each(guide.channels, function(channelKey, c) {
					var ending = "";
					if (c.ending > 0) {
						ending = new Date(c.ending * 1000).timeNow();
					}

					var a = {
						'textLabel': c.nowplaying === "" ? c.fullname : c.nowplaying,
						'detailTextLabel': c.number + " " + c.fullname + (ending === "" ? "" : ", ends at " + ending),
						'icon': "none",
						'sectionHeader': c.category,
						'major': c.number
					};

					if (c.logo !== "") {
						a.image = "www/" + c.logo;
					}

					if (DirecTV.recentChannels.length > 0) {
						if (c.number == DirecTV.recentChannels[0]) {
							currentChannelIndex = channelKey;
						}
					}

					tableView.push(a);
				});
				var nt = window.plugins.NativeTable;
				nt.createTable({
					'height': $(window).height(),
					'showSearchBar': true,
					'showNavBar': true,
					'navTitle': "TV",
					'navBarColor': 'black',
					'showRightButton': true,
					'RightButtonText': 'Close',
					'showBackButton': false,
					'showToolBar': true
				});

				nt.onToolbarButtonClick(function(buttonIndex) {
					if (buttonIndex == 1) { //Recent Channels
						var recentChannels = DirecTV.recentChannels.slice(1, 5);
						var recent = [];

						$.each(recentChannels, function(i, c) {
							recent.push(DirecTV.getTitleForChannel(c));
						});

						if (recent.length >= 1) {
							var actionSheet = window.plugins.actionSheet;
							recent.push("Cancel");
							actionSheet.create({
								title: 'Recent Channels',
								items: recent,
								destructiveButtonIndex: (recent.length - 1)
							}, function(buttonValue, buttonIndex) {
								if (buttonIndex == -1 || buttonIndex == (recent.length - 1)) {
									return;
								} else {
									DirecTV.changeChannel(recentChannels[buttonIndex]);
								}
							});
						}
					}
					if (buttonIndex == 2) { //Volume Down
						gestures.executeGestureByCommandName("VolumeDown");
					}
					if (buttonIndex == 3) { //Volume Up
						gestures.executeGestureByCommandName("VolumeUp");
					}
					if (buttonIndex == 4) { //Peek rooms
						nt.hideTable(function() {
							util.setDeviceByShortName("MCE");
							ui.view.trigger("rightNavButtonTap");
						});
					}
					if (buttonIndex == 5) { //Refresh
						nt.hideTable(function() {
							ui.view.trigger("rightNavButtonTap");
						});
					}
				});

				nt.onRightButtonTap(function() {
					nt.hideTable(function() {});
				});
				nt.setRowSelectCallBackFunction(function(rowId) {
					var item = tableView[rowId];
					DirecTV.changeChannel(item.major);
				});
				nt.setTableData(tableView);

				nt.showTable(function() {
					nt.scrollTo({
						'index': currentChannelIndex
					});
				});
			}
			if (device.shortname == "MCE") {

				util.doHud({
					show: true,
					labelText: "Loading Data...",
					detailsLabelText: "Please Wait..."
				});
				setTimeout(function() {
					mb3.lastOpenedCallBack();
				}, 200);

			}
		});

		ui.view.bind("leftNavButtonTap", function() {
			var tableView = [];
			/* populate it */
			var room = util.getCurrentRoom();
			var device = util.getCurrentDevice();
			var category = "";
			//write globals
			var globals = $(xml).find('gesturePad > rooms > room[index="' + room.index + '"] ~ roomgestures > gesture > device');
			if ($(globals).size() > 0) {
				category = "Global Commands";
				var currentItems = [];
				$(globals).each(function(i) {
					var devicenode = $(this);
					var devicename = $(this).children("name:first").text();
					var roomname = room.name;
					$(devicenode).find("command").each(function() {
						var commandname = $(this).children("name:first").text();
						var gestureDefinition = "";
						gestureDefinition = $(devicenode).parent().attr("definition");
						if (gestureDefinition == "nothing") {
							gestureDefinition = "";
						}
						if (jQuery.inArray(commandname, currentItems) == -1) {
							currentItems.push(commandname);
							tableView.push({
								'textLabel': commandname,
								'detailTextLabel': gestureDefinition === "" ? "No Gesture Defined" : "👆 " + gestureDefinition,
								'icon': 'greyarrow',
								'sectionHeader': category
							});
						}
					});
				});
			}
			//write device specific
			$(xml).find('gesturePad > devices > device[shortname="' + device.shortname + '"]').each(function() {
				var devicenode = $(this);
				var devicename = $(this).children("name:first").text();
				var roomname = room.name;
				$(devicenode).find("command").each(function(i) {
					var actions = $(this).find("action");
					var gestureDefinition = "";
					var commandname = $(this).children("name:first").text();
					$(this).find("gesture").each(function(i) {
						if (i === 0) {
							gestureDefinition = "";
							gestureDefinition = $(this).attr("definition");
						}
					});
					if (category != ($(this).parent().children("name:first").text())) {
						category = $(this).parent().children("name:first").text();
					}
					tableView.push({
						'textLabel': commandname,
						'detailTextLabel': gestureDefinition === "" ? "No Gesture Defined" : "👆 " + gestureDefinition,
						'icon': 'greyarrow',
						'sectionHeader': category
					});
				});
			});

			var nt = window.plugins.NativeTable;
			nt.createTable({
				'height': $(window).height(),
				'showSearchBar': true,
				'showNavBar': true,
				'navTitle': room.name,
				'navBarColor': 'black',
				'showRightButton': true,
				'RightButtonText': 'Close',
				'showBackButton': false
			});
			nt.onRightButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.onBackButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.setRowSelectCallBackFunction(function(rowId) {
				gestures.executeGestureByCommandName(tableView[rowId].textLabel);
			});
			nt.setTableData(tableView);
			nt.showTable(function() {});
		});

		ui.view.bind("configButtonTap", function() {

			var actionSheet = window.plugins.actionSheet;
			var actions = [];
			actions.push("Clear Item Cache");
			actions.push("Clear Image Cache");
			actions.push("Refresh All Items");
			actions.push("Refresh Custom TV");
			actions.push("Play URL");

			actions.push("Cancel");
			actionSheet.create({
				title: 'Actions',
				items: actions,
				destructiveButtonIndex: (actions.length - 1)
			}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1 || buttonIndex == (actions.length - 1)) {
					return;
				} else {
					switch (buttonIndex) {
						case 0:
							cache.clear("json");
							util.setItem("lastRefresh", "2010-01-01T23:44:52.790Z");
							util.doAlert("All Items Cleared");
							break;
						case 1:
							cache.clear("cache");
							util.doAlert("All Images Cleared");
							break;
						case 2:
							util.setItem("lastRefresh", "2010-01-01T23:44:52.790Z");
							mb3.startWorker(true, true);
							break;
						case 3:
							//cache.clear("cache");
							mb3.allItemsPopulated = false;
							util.doAlert("Custom TV Cleared");
							break;
						case 4:
							util.lastYouTubeURL = "";
							util.setItem("lastYouTubeURL", "");
							util.checkForYouTubeLink();
							break;

					}
				}
			});
		});

		ui.view.bind("roomButtonTap", function() {
			var oncomplete = function(buttonIndex) {
				mb3.resetCallback();
				settings.userSettings.roomIndex = buttonIndex;
				settings.userSettings.deviceIndex = 0;
				util.updateStatus();
				util.getRoomStatus();
			};
			var actionSheet = window.plugins.actionSheet;
			var RoomNames = [];
			var rooms = settings.userSettings.rooms;
			for (var i = 0; i < rooms.length; i++) {
				RoomNames.push(rooms[i].name);
			}
			RoomNames.push("Cancel");
			actionSheet.create({
				title: 'Change Room',
				items: RoomNames,
				destructiveButtonIndex: (RoomNames.length - 1)
			}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1 || buttonIndex == (RoomNames.length - 1)) {
					return;
				} else {
					oncomplete(buttonIndex);
				}
			});
		});

		ui.view.bind("inputButtonTap", function() {
			var oncomplete = function(buttonIndex) {
				var room = util.getCurrentRoom();
				settings.userSettings.deviceIndex = buttonIndex;
				var device = util.getCurrentDevice();
				var deviceShortName = device.shortname;

				if (room.IR) {
					util.setDeviceByShortName("MCE"); //force device back to MCE, because EG swithces the inputs
					var switchInputNode = $(xml).find('gesturePad > devices > device[shortname="MCE"] > commands > category > command > action > onCompleteSetDevice[shortname="' + deviceShortName + '"]:first');
					if ($(switchInputNode).size() > 0) {
						gestures.doEvent("manual", $(switchInputNode).parent());
						//util.getRoomStatus();
					}
				}

			};
			var actionSheet = window.plugins.actionSheet;
			var RoomDevices = [];
			var devices = util.getCurrentRoom().devices;
			for (var i = 0; i < devices.length; i++) {
				RoomDevices.push(devices[i].name);
			}
			RoomDevices.push("Cancel");
			actionSheet.create({
				title: 'Switch Input',
				items: RoomDevices,
				destructiveButtonIndex: (RoomDevices.length - 1)
			}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1 || buttonIndex == (RoomDevices.length - 1)) {
					return;
				} else {
					var devices = util.getCurrentRoom().devices;
					for (var i = 0; i < devices.length; i++) {
						if (devices[i].name === buttonValue) {
							util.setDeviceByShortName(devices[i].shortname);
							ui.clearNowPlaying();
							util.updateStatus();
						}
					}

					oncomplete(buttonIndex);
				}
			});
		});

		ui.view.bind("powerButtonTap", function() {
			gestures.executeGestureByCommandName("Power");
		});
		ui.view.bind("playButtonTap", function(isPlaying) {
			if (isPlaying) {
				gestures.executeGestureByCommandName("Pause");
			} else {
				gestures.executeGestureByCommandName("Play");
			}
		});
		ui.view.bind("rewindButtonTap", function() {
			gestures.executeGestureByCommandName("Skip Back");
		});
		ui.view.bind("forwardButtonTap", function() {
			gestures.executeGestureByCommandName("Skip Forward");
		});
		ui.view.bind("muteButtonTap", function() {
			gestures.executeGestureByCommandName("Mute");
		});

		ui.view.bind("volumeChange", function(percentageDragged) {
			console.log(percentageDragged);
			var MaxVolumeJump = 20;
			var seekTo = Math.round(MaxVolumeJump - (MaxVolumeJump * (percentageDragged / 100)));
			var sendval = 0;
			if (seekTo >= (MaxVolumeJump / 2)) {
				//down
				sendval = (seekTo - (MaxVolumeJump / 2));
				if (sendval > 0) {
					sliders.sendVolumeChange(sendval, "VolumeDown");
					ui.view.setVolumeSlider({
						value: 50
					});
				}
			} else {
				// Up	
				sendval = ((MaxVolumeJump / 2) - seekTo);
				if (sendval > 0) {
					sliders.sendVolumeChange(sendval, "VolumeUp");
					ui.view.setVolumeSlider({
						value: 50
					});
				}
			}
		});

		ui.view.bind("seekChange", function(percentageDragged) {
			if (util.getCurrentDevice().shortname == "MCE") {
				if (ui.nowPlaying.duration > 0) {

					percentageDragged = percentageDragged / 100;
					var seekTo = Math.floor(ui.nowPlaying.duration * percentageDragged);
					//$(this).attr("data-sendval", seekTo);
					sliders.sendSeekEvent(seekTo);
					//slideTimer = setTimeout(doSeekEvent, 500);
				}
			}
		});

	},
	clearNowPlaying: function() {
		ui.view.setOptionsForView({
			durationStartText: "",
			durationEndText: "",
			durationSliderValue: 0,
			duration: 0,
			title: "",
			subTitle: "",
			url: ""
		});
		//sliders.resetNPSeek();
	},
	queryNowPlaying: function() {
		if (ui.screenShotMode) {
			return;
		}

		var device = util.getCurrentDevice();
		if (device.shortname == "MCE") {

			var url = mb3.getServiceUrl() + "/mediabrowser/Sessions?format=json";
			$.ajax({
				url: url,
				dataType: "json",
				timeout: 10000,
				success: function(j) {
					var foundClient = false;
					$.each(j, function(k, client) {
						if (client.DeviceId === device.clientName) {
							mb3.config.clientId = client.Id;
							if (client.NowPlayingPositionTicks) {
								var duration = client.NowPlayingItem.RunTimeTicks;
								var offset = client.NowPlayingPositionTicks;
								var perc = offset / duration;
								var currentID = client.NowPlayingItem.Id;
								var guid = client.NowPlayingItem.Id;
								ui.view.setOptionsForView({
									durationStartText: util.hms2( util.ticksToSeconds(offset) ),
									durationEndText: "-" + util.hms2( util.ticksToSeconds(duration - offset) ),
									durationSliderValue: util.isNumeric(perc) ? Math.floor(perc * 100) : 0,
									guid: guid,
									currentID: currentID,
									title: client.NowPlayingItem.Name,
									subTitle: client.Client + " " + client.NowPlayingItem.Type,
									duration: duration,
									controller: device.clientName,
									url: mb3.getServiceUrl() + "/mediabrowser/Items/" + client.NowPlayingItem.Id + "/Images/Primary",
									backdrop: mb3.getServiceUrl() + "/mediabrowser/Items/" + client.NowPlayingItem.Id + "/Images/Backdrop",
									isPlaying: (client.IsPaused === true ? false : true)
								});
								foundClient = true;
								return false;
							}
						}
					});

					if (foundClient === false) {
						ui.clearNowPlaying();
					}

				},
				error: function() {
					ui.clearNowPlaying();
				}
			});
		}
		if (device.shortname == "DTV") {
			$.ajax({
				type: "GET",
				url: "http://" + device.IPAddress + ":" + device.Port + "/tv/getTuned",
				dataType: "json",
				timeout: 10000,
				success: function(json) {
					if (json.startTime && json.startTime != "0") {} else {
						ui.view.setOptionsForView({
							durationStartText: "",
							durationEndText: "",
							durationSliderValue: 0,
							duration: 0,
							url: ""
						});
						return;
					}

					var perc = json.offset / json.duration;
					DirecTV.addToRecentChannels(json.major);

					ui.view.setOptionsForView({
						durationStartText: util.hms2(json.offset),
						durationEndText: "-" + util.hms2(json.duration - json.offset),
						durationSliderValue: Math.floor(perc * 100),
						guid: null,
						currentID: null,
						title: json.title,
						item: json.callsign + json.major,
						subTitle: json.major + " " + json.callsign,
						duration: 0,
						isPlaying: false,
						url: "",
						backdrop: ""
					});

					$.ajax({
						type: "GET",
						url: "http://www.thetvdb.com/api/GetSeries.php?seriesname=" + json.title,
						dataType: "xml",
						success: function(tvxml) {
							var url = "";
							var guid = "";
							$(tvxml).find("Data > Series > SeriesName").each(function() {
								if ($(this).text().toLowerCase().replace(/\W/g, '').replace('the', '') == json.title.toLowerCase().replace(/\W/g, '').replace('the', '')) {
									guid = $(this).parent().find("seriesid").text();
									return false;
								}
							});
							if (guid !== "") {
								var imgID = "TVDB_" + guid;
								$.ajax({
									type: "GET",
									url: "http://thetvdb.com/api/77658293DB487350/series/" + guid + "/",
									dataType: "xml",
									success: function(seriesxml) {
										var poster = $(seriesxml).find("poster:first");
										if ($(poster).size() > 0) {
											ui.view.setOptionsForView({
												"url": "http://thetvdb.com/banners/_cache/" + $(poster).text(),
												"backdrop": "http://thetvdb.com/banners/_cache/" + $(poster).text()
											});
										}
									}
								});
							}
						}
					});

				}
			});
		}
	}
};