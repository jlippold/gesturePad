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
		var MBUrl = mb3.getServiceUrl();
		MBUrl += "/mediabrowser/Sessions/" + mb3.config.clientId + "/Playing/seek?SeekPositionTicks=" + seek;
		console.log(MBUrl);
		$.ajax({
			url: MBUrl,
			type: "POST",
			success: function(json) {
				console.log(json);
				setTimeout(function() {
					ui.queryNowPlaying();
				}, 1500);
			}
		});
	}
};