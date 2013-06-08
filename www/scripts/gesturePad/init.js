//globals
var xml, appSettings;
var appendOncetoQueryString = "";
var npTimer, inputTimer, clickEventType;
var guide = {};
var workerTimer = null;
var scrollstop = null;
var geniusResults = {
	refreshQueue: [],
	Titles: {},
	TitlesQueue: {},
	allItems: [],
	loaded: false
};
var init = {
	PhoneGapReady: function() {
		document.addEventListener("deviceready", init.onDeviceReady, false);
		document.addEventListener("resume", init.onResume, false);
		document.addEventListener("pause", init.onBackground, false);
		window.onorientationchange = util.detectOrientation;
		window.onresize = util.detectOrientation;
		window.onerror = function(msg, url, line) {
			console.log("\n\n" + msg + "\n" + url + "\nline " + line + "\n\n\n");
		};
	},
	onDeviceReady: function() {
		util.splash("show");
		$.gestures.init();
		$.gestures.retGesture(function(gesture) {
			gestures.doEvent(gesture);
		});

		util.doResize();
		notify.init();
		notify.clearAllBadges();
		ui.initiateBindings();
		settings.loadSettings();
		if (settings.userSettings.isSetup === false) {
			return;
		}
		window.setTimeout(function() {
			MediaBrowser.startWorker(true);
		}, 2000);

		//load channels for DTV, if defined in settings
		if (DirecTV.hasDirecTV()) {
			DirecTV.loadChannelList();
		}
		util.splash("hide");

		npTimer = setInterval(function() {
			ui.queryNowPlaying();
			util.getRoomStatus();
		}, 30000);

		window.scrollTo(0, 0);
	},
	onResume: function() {
		settings.checkSettingsForUpdate();
		if (settings.userSettings.isSetup === false) {
			return;
		}
		notify.clearAllBadges();
		util.getRoomStatus();
		DirecTV.startWorker();
		MediaBrowser.startWorker(false);
		ui.queryNowPlaying();
		npTimer = setInterval(function() {
			ui.queryNowPlaying();
		}, 30000);
	},
	onBackground: function() {
		clearInterval(npTimer);
	},
	loadXML: function() {
		var xmlLoc = settings.userSettings.configURL + "?r=" + Math.random();
		$.ajax({
			type: "GET",
			url: xmlLoc,
			dataType: "xml",
			success: function(resp) {
				xml = resp;
				util.setItem("configURL", settings.userSettings.configURL);
			},
			error: function() {
				util.doAlert("Fatal error loading xml settings: " + xmlLoc);
			}
		});
	}
};