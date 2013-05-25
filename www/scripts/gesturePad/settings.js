var settings = {
	userSettings: {},
	loadSettings: function() {
		//defaults
		settings.userSettings = settings.getSettingsObject();
		settings.userSettings.deviceIndex = util.getItem("deviceIndex", 0);
		settings.userSettings.roomIndex = util.getItem("roomIndex", 0);
		if (util.isNumeric(settings.userSettings.roomIndex) === false || util.isNumeric(settings.userSettings.deviceIndex) === false) {
			util.setItem("roomIndex", 0);
			util.setItem("deviceIndex", 0);
			settings.userSettings.roomIndex = 0;
			settings.userSettings.deviceIndex = 0;
		}
		//load channels for DTV, if defined in settings
		if (DirecTV.hasDirecTV()) {
			DirecTV.loadChannelList();
		}
		util.setItem("configURL", "");
		if (util.getItem("configURL", "") != settings.userSettings.configURL) {
			init.loadXML();
		}
		util.updateStatus();
		util.getRoomStatus();
		setTimeout(function() {
			util.splash("hide");
		}, 500);
	},
	getSettingsObject: function() {
		var settingsObj = {
			sounds: false,
			vibrate: false,
			wifi: true,
			SleepThreshold: 60000,
			MBServiceTimeout: 120000,
			moviesByDate: false,
			tvByDate: false,
			configURL: "mbeg.xml",
			roomIndex: 0,
			deviceIndex: 0,
			rooms: []
		};
		//load from IOS prefs
		window.plugins.applicationPreferences.get('All', function(result) {
			var hasRoom = false;
			appSettings = result;
			var d = jQuery.parseJSON(result);
			//general settings
			if (d.sounds == 1) {
				settingsObj.sounds = true;
			}
			if (d.vibrate == 1) {
				settingsObj.vibrate = true;
			}
			if (d.wifi === 0) {
				settingsObj.wifi = false;
			}
			if (d.dateMovies == 1) {
				settingsObj.moviesByDate = true;
			}
			if (d.dateTV == 1) {
				settingsObj.tvByDate = true;
			}
			//gesture XML
			if (d.config_source == 1) {
				settingsObj.configURL = "mbeg.xml";
			} else {
				if (d.config_source == 2) {
					settingsObj.configURL = "mbegdt.xml";
				} else {
					if (d.config_source == 3) {
						settingsObj.configURL = d.custom_config;
					}
				}
			}
			//get rooms
			for (var i = 1; i <= 5; i++) {
				if (d["S" + i + "_enabled"]) {
					if (d["S" + i + "_enabled"] == 1) {
						hasRoom = true;
						var thisroom = {
							name: "Room " + i,
							index: (i - 1),
							DTV: null,
							IR: false,
							devices: []
						};
						thisroom.name = d["S" + i + "_RoomName"];
						thisroom.devices.push({
							"name": "Movies",
							"shortname": "MCE",
							"IPAddress": d["S" + i + "_IP"],
							"Port": d["S" + i + "_EGPort"],
							"ServicePort": d["S" + i + "_MBPort"],
							"timeshift": true,
							"index": 0
						});
						if (d["S" + i + "_DTV"] == 1) {
							thisroom.DTV = d["S" + i + "_DTVIP"];
							thisroom.devices.push({
								"name": "Television",
								"shortname": "DTV",
								"IPAddress": d["S" + i + "_DTVIP"],
								"Port": 8080,
								"timeshift": false,
								"index": 1
							});
						}
						if (d["S" + i + "_EG"] == 1) {
							thisroom.IR = true;
						}
						settingsObj.rooms.push(thisroom);
					}
				}
			}
			if (hasRoom === false) {
				util.doAlert("No Servers are defined. Go to settings to add a server.");
				util.splash("hide");
			}
			settingsObj.roomIndex = util.getItem("roomIndex", 0);
			settingsObj.deviceIndex = util.getItem("deviceIndex", 0);
		});
		return settingsObj;
	},
	checkSettingsForUpdate: function() {
		window.plugins.applicationPreferences.get('All', function(result) {
			if (result != appSettings) {
				util.doAlert("Your settings have changed. Quit the app from the app switcher to reload.");
				util.reloadPage();
			}
		});
	}
};