var ui = {
	initiateBindings: function() {
		$("#top, #toptrans, #overallVolumeContainer").bind("touchmove", function(event) {
			event.preventDefault();
		});
		ui.bindButtons();
		sliders.bindSliders();
		bottomDraw.bind();
	},
	bindButtons: function() {
		$("#btnTitles").bind("click", function() {

			window.scrollTo(0, 0);
			var curChannel = $("#NowPlayingTitle").attr("data-item");
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
							$("#btnTitles").trigger("click");
						});
					}
					if (buttonIndex == 5) { //Refresh
						nt.hideTable(function() {
							$("#btnTitles").trigger("click");
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
					MediaBrowser.lastOpenedCallBack();
				}, 200);

			}

		});
		$("#btnConfig").fastClick(function() {

			var actionSheet = window.plugins.actionSheet;
			var actions = [];
			actions.push("Clear Item Cache");
			actions.push("Clear Image Cache");
			actions.push("Refresh All Items");
			actions.push("Refresh Custom TV");

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
							util.alert("All Items Cleared");
							break;
						case 1:
							cache.clear("cache");
							util.alert("All Images Cleared");
							break;
						case 2:
							util.setItem("lastRefresh", "2010-01-01T23:44:52.790Z");
							MediaBrowser.startWorker(true, true);
							break;
						case 3:
							//cache.clear("cache");
							MediaBrowserNowPlaying.allItemsPopulated = false;
							util.alert("Custom TV Cleared");
							break;

					}
				}
			});

		});
		$("#btnCommands").fastClick(function() {
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
		$("#btnRoom").fastClick(function() {
			var oncomplete = function(buttonIndex) {
				MediaBrowser.resetCallback();
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
		$("#btnTransfer").fastClick(function() {
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
		$("#btnPower").fastClick(function() {
			gestures.executeGestureByCommandName("Power");
		});
		$("#btnPlay").bind("click", function() {
			if ($(this).hasClass("playing")) {
				gestures.executeGestureByCommandName("Pause");
				$(this).removeClass("playing");
			} else {
				gestures.executeGestureByCommandName("Play");
			}
		});
		$("#btnMute").fastClick(function() {
			gestures.executeGestureByCommandName("Mute");
		});
	},
	clearNowPlaying: function() {
		$("#bgPic").attr("class", "noart");
		$("#bgPic").attr("style", "");
		$("#bgPic").attr("data-id", "");
		$("#NowPlayingTitle").text("");
		$("#NowPlayingTitle").removeClass("doMarquee");
		sliders.resetNPSeek();
	},
	queryNowPlaying: function() {
		var device = util.getCurrentDevice();
		if (device.shortname == "MCE") {
			var base = util.getMBUrl();
			$.ajax({
				url: base + "ui",
				dataType: "json",
				timeout: 10000,
				success: function(j) {
					var duration = 0;
					try {
						duration = j.Data.PlayingControllers[0].CurrentFileDuration.TotalSeconds;
					} catch (e) {
						return;
					}
					if (j.Data.PlayingControllers.length >= 1) {
						duration = j.Data.PlayingControllers[0].CurrentFileDuration.TotalSeconds;
						var offset = j.Data.PlayingControllers[0].CurrentFilePosition.TotalSeconds;
						var perc = offset / duration;
						sliders.setNPSeek(Math.floor(perc * 100));
						$("#timespanleft").text(util.hms2(offset));
						$("#timespanright").text("- " + util.hms2(duration - offset));
						$("#timespanright").attr("data-duration", j.Data.PlayingControllers[0].CurrentFileDuration.Ticks);
						$("#timespanright").attr("data-controller", j.Data.PlayingControllers[0].ControllerName);
						$("#NowPlayingTitle").text(j.Data.PlayingControllers[0].PlayableItems[0].DisplayName);
						if (parseInt($('#NowPlayingTitle')[0].scrollWidth, 10) > parseInt($('#NowPlayingTitle').width(), 10)) {
							$("#NowPlayingTitle").attr("class", "doMarquee");
						} else {
							$("#NowPlayingTitle").removeClass("doMarquee");
						}
						var currentID = j.Data.PlayingControllers[0].PlayableItems[0].CurrentMediaIndex;
						var guid = j.Data.PlayingControllers[0].PlayableItems[0].MediaItemIds[currentID];
						if ($("#bgPic").attr("data-id") != guid) {
							var imgID = "MB_Big_" + guid;
							cache.getImage({
								id: imgID,
								url: base + "image/?Id=" + guid
							}, function(r) {
								var img = new Image();
								img.onerror = function() {
									$("#bgPic").attr("class", "noart");
									$("#bgPic").attr("style", "");
									$("#bgPic").attr("data-id", guid);
								};
								if (r.cached === false) {
									img.onload = function() {
										cache.saveImage({
											id: imgID,
											img: img
										});
										$("#bgPic").attr("style", "background-image: url(" + r.url + ");");
										$("#bgPic").attr("class", "");
										$("#bgPic").attr("data-id", guid);
									};
									img.src = r.url;
								} else {
									$("#bgPic").attr("style", "background-image: url(" + r.url + ");");
									$("#bgPic").attr("class", "");
									$("#bgPic").attr("data-id", guid);
								}
							});
						}
						if (j.Data.PlayingControllers[0].IsPaused === true) {
							$("#btnPlay").removeClass("playing");
						} else {
							$("#btnPlay").addClass("playing");
						}
					} else {
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
					if (json.startTime) {
						if (json.startTime == "0") {
							return;
						}
						var perc = json.offset / json.duration;
						sliders.setNPSeek(Math.floor(perc * 100));
						$("#timespanleft").text(util.hms2(json.offset));
						$("#timespanright").text("- " + util.hms2(json.duration - json.offset));
					}

					var output = json.major + " " + json.callsign + " " + json.title;
					DirecTV.addToRecentChannels(json.major);
					$("#NowPlayingTitle").text(output);
					$("#NowPlayingTitle").attr("data-item", json.callsign + json.major);
					$("#NowPlayingTitle").attr("class", "");
					$.ajax({
						type: "GET",
						url: "http://www.thetvdb.com/api/GetSeries.php?seriesname=" + json.title,
						dataType: "xml",
						error: function(x, y, z) {
							$("#bgPic").attr("class", "noart");
							$("#bgPic").attr("style", "");
						},
						success: function(tvxml) {
							var url = "";
							var guid = "";
							$(tvxml).find("Data > Series > SeriesName").each(function() {
								if ($(this).text().toLowerCase().replace(/\W/g, '').replace('the', '') == json.title.toLowerCase().replace(/\W/g, '').replace('the', '')) {
									guid = $(this).parent().find("seriesid").text();
									return false;
								}
							});
							if (guid === "") {
								$("#bgPic").attr("class", "noart");
								$("#bgPic").attr("style", "");
							} else {
								var imgID = "TVDB_" + guid;
								cache.getImage({
									id: imgID,
									url: ""
								}, function(r) {
									if (r.cached === false) {
										//query tvdb for the image
										$.ajax({
											type: "GET",
											url: "http://thetvdb.com/api/77658293DB487350/series/" + guid + "/",
											dataType: "xml",
											error: function(x, y, z) {
												$("#bgPic").attr("class", "noart");
												$("#bgPic").attr("style", "");
											},
											success: function(seriesxml) {
												var poster = $(seriesxml).find("poster:first");
												if ($(poster).size() > 0) {
													if ($("#bgPic").attr("data-id") != guid && $(poster).text() !== "") {
														$("#bgPic").attr("style", "background-image: url('http://thetvdb.com/banners/_cache/" + $(poster).text() + "');");
														$("#bgPic").attr("class", "");
														$("#bgPic").attr("data-id", guid);
														//cache this result
														var img = new Image();
														img.onload = function() {
															cache.saveImage({
																id: imgID,
																img: img
															});
														};
														img.src = "http://thetvdb.com/banners/_cache/" + $(poster).text();
													}
												} else {
													$("#bgPic").attr("class", "noart");
													$("#bgPic").attr("style", "");
												}
											}
										});
									} else {
										$("#bgPic").attr("style", "background-image: url(" + r.url + ");");
										$("#bgPic").attr("class", "");
										$("#bgPic").attr("data-id", guid);
									}
								});
							}
						}
					});
					if (parseInt($('#NowPlayingTitle')[0].scrollWidth, 10) > parseInt($('#NowPlayingTitle').width(), 10)) {
						$("#NowPlayingTitle").attr("class", "doMarquee");
					} else {
						$("#NowPlayingTitle").removeClass("doMarquee");
					}
				}
			});
		}
	}
};