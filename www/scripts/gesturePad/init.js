//globals
var xml, appSettings;
var appendOncetoQueryString = "";
var npTimer, inputTimer, clickEventType;
var guide = {};
var workerTimer = null;
var scrollstop = null;

var init = {
	PhoneGapReady: function() {
		document.addEventListener("deviceready", init.onDeviceReady, false);
		document.addEventListener("resume", init.onResume, false);
		document.addEventListener("pause", init.onBackground, false);
		window.onorientationchange = util.detectOrientation;
		window.onresize = util.detectOrientation;
		window.onerror = function(msg, url, line) {
			console.log("\n\n" + msg + "\n" + url + "\nline " + line + "\n\n\n");
			util.doHud({
				show: false
			});
		};
	},
	onDeviceReady: function() {
		util.splash("show");
		$.gestures.init();
		$.gestures.retGesture(function(gesture) {
			gestures.doEvent(gesture);
		});

		ui.initiateBindings();

		util.doResize();
		notify.init();
		notify.clearAllBadges();

		settings.loadSettings();

		if (settings.userSettings.isSetup === false) {
			return;
		}

		//load channels for DTV, if defined in settings
		if (DirecTV.hasDirecTV()) {
			DirecTV.loadChannelList();
		}
		util.splash("hide");

		npTimer = setInterval(function() {
			ui.queryNowPlaying();
			util.getRoomStatus();
		}, 30000);

		mb3.authenticateUser("treason", "urchin");

		window.scrollTo(0, 0);
		util.checkForYouTubeLink();
	},
	onResume: function() {
		settings.checkSettingsForUpdate();
		if (settings.userSettings.isSetup === false) {
			return;
		}

		//notify.clearAllBadges();
		util.getRoomStatus();
		DirecTV.startWorker();
		ui.queryNowPlaying();
		//npTimer = setInterval(function() {
		//	ui.queryNowPlaying();
		//}, 30000);

		util.checkForYouTubeLink();

	},
	onBackground: function() {
		//clearInterval(npTimer);
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