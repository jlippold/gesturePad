//globals
var xml, appSettings;
var appendOncetoQueryString = "";
var npTimer, inputTimer, clickEventType, slideTimer;
var guide = {};
var workerTimer = null;
var sleepTimer = null;
var scrollstop = null;
var geniusResults = {
	allItems: []
};
var init = {
	PhoneGapReady: function() {
		document.addEventListener('deviceready', init.onDeviceReady, false);
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

		npTimer = setInterval(function() {
			ui.queryNowPlaying();
			util.getRoomStatus();
		}, 30000);

		window.scrollTo(0, 0);
	},
	onResume: function() {
		settings.checkSettingsForUpdate();
		clearAllBadges();
		util.getRoomStatus();
		SleepDevice(false);
		DirecTV.startWorker();
		MediaBrowser.startWorker();
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
				util.splash("hide");
				util.doAlert("Error loading xml settings: " + xmlLoc);
			}
		});
	}
};