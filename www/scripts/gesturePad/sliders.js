var sliders = {
	sendVolumeChange: function(val, command) {
		appendOncetoQueryString = "&" + val;
		gestures.executeGestureByCommandName(command);
	},
	sendSeekEvent: function(seek) {
		var device = util.getCurrentDevice();
		if (device.shortname != "MCE") {
			return;
		}
		var base = util.getMBUrl() + "ui?command=seek&value=" + seek + "&controllerName=" + ui.nowPlaying.controller;
		$.getJSON(base, function() {
			setTimeout(function() {
				ui.queryNowPlaying();
			}, 1500);
		});
	}
};