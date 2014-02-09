var gestures = {
	executeGestureByCommandName: function(command) {
		var room = util.getCurrentRoom();
		var device = util.getCurrentDevice();
		//check if there's a global gesture for it
		var globals = $(xml).find("gesturePad > rooms > room[index='" + room.index + "'] ~ roomgestures > gesture > device > command > name:contains('" + command + "'):first");
		if ($(globals).size() > 0) {
			var globalDevicetoTrigger = $(globals).parent().parent().attr("shortname");
			$(xml).find("gesturePad > devices > device[shortname='" + globalDevicetoTrigger + "'] > commands > category > command > name:contains('" + command + "'):first").each(function() {
				actionNodes = $(this).parent().find("action");
				device = util.getDeviceByShortName(globalDevicetoTrigger); //replace the device with the global gesture device
				gestures.doEvent("manual", actionNodes, device);
			});
		} else {
			//check for a regular command
			var commandNode = $(xml).find("gesturePad > devices > device[shortname='" + device.shortname + "'] > commands > category > command > name:contains('" + command + "'):first");
			if ($(commandNode).size() == 1) {
				actionNodes = $(commandNode).next();
				gestures.doEvent("manual", actionNodes, device);
			}
		}
	},
	doEvent: function(gesture, actions, overRideDevice) {
		$("#hud").hide();
		window.scrollTo(0, 0);
		if (util.isWifi() === false) {
			util.doAlert("You are not on Wifi. Connect to Wifi and try again");
			return;
		}
		util.clearCallers(false);
		var showCallback = true;
		if ($("#gestures_canvas:visible").size() === 0) {
			showCallback = false;
		}
		if (showCallback) {
			//$("#gestureCallback").append(message);
		}
		var room = util.getCurrentRoom();
		var device = util.getCurrentDevice();
		if (typeof overRideDevice !== 'undefined') {
			device = overRideDevice;
		}
		var blnGoodGesture = true;
		var blnisGlobalGesture = false;
		var actionNodes = null;
		if (gesture != 'manual') { //search for it in the XML
			//find a global command that matches the gesture
			$(xml).find("gesturePad > rooms > room[index='" + room.index + "'] ~ roomgestures > gesture[definition='" + gesture + "'] > device:first").each(function() {
				var globalDevicetoTrigger = $(this).attr("shortname");
				var globalCommandtoTrigger = $(this).find("command > name").text();
				$(xml).find("gesturePad > devices > device[shortname='" + globalDevicetoTrigger + "'] > commands > category > command > name:contains('" + globalCommandtoTrigger + "'):first").each(function() {
					blnisGlobalGesture = true;
					blnGoodGesture = true;
					actionNodes = $(this).parent().find("action");
					device = util.getDeviceByShortName(globalDevicetoTrigger); //replace the device with the global gesture device
				});
			});
			//if not a global, find a device specific non-global command
			if (blnisGlobalGesture === false) {
				$(xml).find("gesturePad > devices > device[shortname='" + device.shortname + "'] > commands > category > command > gesture[definition='" + gesture + "']:first").each(function() {
					blnGoodGesture = true;
					actionNodes = $(this).parent().find("action");
				});
			}
		} else { //adtion node is already supplied, so run em
			actionNodes = $(actions);
		}
		if (actionNodes === null) {
			blnGoodGesture = false;
		}
		if (blnGoodGesture) {
			//Run commands for gesture
			util.playBeep();
			//show pending notification

			var gestureName = $(actionNodes).parent().find("name:first").text();
			util.showNotification(gestureName, gesture);
			var totalActions = ($(actionNodes).size() - 1);
			//Trigger ajax events
			$(actionNodes).each(function(i) {
				var thisnode = $(actionNodes);
				//Look up url overrides
				var server = "http://" + device.IPAddress + ":" + device.Port + "/";
				$(this).find("addtobaseurl:first").each(function() {
					server = server + $(this).text();
				});
				$(this).find("replacebaseurl:first").each(function() {
					server = $(this).text();
				});

				if (server.indexOf(":80") > 0) { //eventghost kitchen hack
					appendOncetoQueryString += "&room=" + room.name;
				}

				$.ajax({
					type: $(this).find("method:first").text(),
					url: server,
					data: $(this).find("data:first").text() + appendOncetoQueryString,
					timeout: 15000,
					dataType: $(this).find("dataType:first").text(),
					success: function(resp) {
						appendOncetoQueryString = "";
						if (i == totalActions) { //only run animation callback on final ajax call
							//util.showNotification(gestureName, gesture);
							if ($(thisnode).find("onCompleteSetDevice").size() > 0) {
								util.setDeviceByShortName($(thisnode).find("onCompleteSetDevice").attr("shortname"));
								util.updateStatus();
							}
						}

						if (gestureName == "Stop" || gestureName.indexOf("channel") > -1) {
							ui.clearNowPlaying();
						}

						setTimeout(function() {
							ui.queryNowPlaying();
						}, 1500);
					},
					error: function() {
						appendOncetoQueryString = "";
						if (i == totalActions) { //only run animation callback on final ajax call
							util.showNotification(gestureName, '❌ No response from server');
							if ($(thisnode).find("onCompleteSetDevice").size() > 0) {
								util.setDeviceByShortName($(thisnode).find("onCompleteSetDevice").attr("shortname"));
								util.updateStatus();
							}
						}
					}
				});
				
			});
		} else {
			//Unassigned gesture, just show and hide it
			util.showNotification('Unassigned', 'Gesture doesnt exist');

		}
	}
};