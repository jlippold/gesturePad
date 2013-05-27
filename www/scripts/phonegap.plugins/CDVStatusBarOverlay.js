/*
 //
 //  Created for phonegap by https://github.com/treason/
 //  ObjC forked from https://github.com/myell0w/MTStatusBarOverlay
 //
 */

(function(cordova) {

	function CDVStatusBarOverlay() {}
	CDVStatusBarOverlay.prototype.setStatusBar = function(params) {
		cordova.exec("CDVStatusBarOverlay.setStatusBar", params);
	};
	CDVStatusBarOverlay.prototype.clearStatusBar = function() {
		cordova.exec("CDVStatusBarOverlay.clearStatusBar");
	};

	cordova.addConstructor(function() {
		if (!window.plugins) window.plugins = {};
		window.plugins.CDVStatusBarOverlay = new CDVStatusBarOverlay();
	});

})(window.cordova || window.Cordova);