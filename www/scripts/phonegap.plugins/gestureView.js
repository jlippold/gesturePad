(function(cordova) {

	function GestureView() {
		this.rightNavButtonTap = null;
		this.leftNavButtonTap = null;
		this.powerButtonTap = null;
		this.configButtonTap = null;
		this.roomButtonTap = null;
		this.inputButtonTap = null;
		this.playButtonTap = null;
		this.muteButtonTap = null;
		this.rewindButtonTap = null;
		this.forwardButtonTap = null;
		this.volumeChange = null;
		this.seekChange = null;
	}

	GestureView.prototype.create = function(params) {
		cordova.exec("GestureView.create", params);
	};

	GestureView.prototype.showNotification = function(params) {
		cordova.exec("GestureView.showNotification", params);
	};

	GestureView.prototype.setVolumeSlider = function(params) {
		if (util.isNumeric(params.value)) {
			cordova.exec("GestureView.setVolumeSlider", params);
		}
	};

	GestureView.prototype.bind = function(element, callbackFunction, params) {
		this[element] = callbackFunction;
	};
	GestureView.prototype.trigger = function(element) {
		if (this[element])
			this[element]();
	};

	GestureView.prototype.setOptionsForView = function(params) {
		$.each(params, function(key, val) {
			ui.nowPlaying[key] = val;
		});
		//console.log(params);
		cordova.exec("GestureView.setOptionsForView", ui.nowPlaying);
	};

	GestureView.prototype._onLeftNavButtonTap = function() {
		if (this.leftNavButtonTap)
			this.leftNavButtonTap();
	};

	GestureView.prototype._onRightNavButtonTap = function() {
		if (this.rightNavButtonTap)
			this.rightNavButtonTap();
	};

	GestureView.prototype._onPowerButtonTap = function() {
		if (this.powerButtonTap)
			this.powerButtonTap();
	};
	GestureView.prototype._onConfigButtonTap = function() {
		if (this.configButtonTap)
			this.configButtonTap();
	};
	GestureView.prototype._onRoomButtonTap = function() {
		if (this.roomButtonTap)
			this.roomButtonTap();
	};
	GestureView.prototype._onInputButtonTap = function() {
		if (this.inputButtonTap)
			this.inputButtonTap();
	};
	GestureView.prototype._onPlayButtonTap = function(isPlaying) {
		if (this.playButtonTap)
			this.playButtonTap(isPlaying);
	};
	GestureView.prototype._onMuteButtonTap = function() {
		if (this.muteButtonTap)
			this.muteButtonTap();
	};
	GestureView.prototype._onRewindButtonTap = function() {
		if (this.rewindButtonTap)
			this.rewindButtonTap();
	};
	GestureView.prototype._onForwardButtonTap = function() {
		if (this.forwardButtonTap)
			this.forwardButtonTap();
	};

	GestureView.prototype._onSeekChanged = function(percentage) {
		if (this.seekChange)
			this.seekChange(percentage);
	};
	GestureView.prototype._onVolumeChanged = function(percentage) {
		if (this.volumeChange)
			this.volumeChange(percentage);
	};

	cordova.addConstructor(function() {
		if (!window.plugins) window.plugins = {};
		window.plugins.GestureView = new GestureView();
	});

})(window.cordova || window.Cordova);