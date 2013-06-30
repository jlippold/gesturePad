// Based off VolumeSlider.js by Tommy-Carlos Williams
//	
//	Slider Cordova Plugin
//      MIT Licensed
//
(function() {
	var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks
	var changeFuction = [];
	var dragFuction = [];
	var VolumeSlider = function() {};

	/**
	 * Create a volume slider.
	 */
	VolumeSlider.prototype.createVolumeSlider = function(originx, originy, width, height, tag) {
		cordovaRef.exec(null, null, "VolumeSlider", "createVolumeSlider", [originx, originy, width, height, tag]);
	};

	/**
	 * Show the volume slider
	 */
	VolumeSlider.prototype.showVolumeSlider = function(tag) {
		cordovaRef.exec(null, null, "VolumeSlider", "showVolumeSlider", [tag]);
	};
	/**
	 * Hide the volume slider
	 */
	VolumeSlider.prototype.hideVolumeSlider = function(tag) {
		cordovaRef.exec(null, null, "VolumeSlider", "hideVolumeSlider", [tag]);
	};
	/**
	 * Set the volume slider
	 */
	VolumeSlider.prototype.setVolumeSlider = function(val, tag) {
		if (isNaN(val) === false) {
			cordovaRef.exec(null, null, "VolumeSlider", "setVolumeSlider", [val, tag]);
		}
	};
	/**
	 * resize
	 */
	VolumeSlider.prototype.resize = function(originx, originy, width, height, tag) {
		cordovaRef.exec(null, null, "VolumeSlider", "resize", [originx, originy, width, height, tag]);
	};

	/**
	 * changed callback
	 */
	VolumeSlider.prototype._onSliderChanged = function(percentage, tag) {
		tag = tag - 200;
		if (changeFuction[tag])
			changeFuction[tag](percentage, tag);
	};

	VolumeSlider.prototype.onSliderChanged = function(callBkFunc, tag) {
		changeFuction[tag] = callBkFunc;
	};

	/**
	 * dragged callback
	 */
	VolumeSlider.prototype._onSliderDragged = function(percentage, tag) {
		tag = tag - 200;
		if (dragFuction[tag])
			dragFuction[tag](percentage, tag);
	};

	VolumeSlider.prototype.onSliderDragged = function(callBkFunc, tag) {
		dragFuction[tag] = callBkFunc;
	};

	cordovaRef.addConstructor(function() {
		if (!window.plugins) {
			window.plugins = {};
		}
		window.plugins.volumeSlider = new VolumeSlider();
	});
})();