var sliders = {
	bindSliders: function() {

		/* seek control */
		var seekbar = window.plugins.volumeSlider;
		seekbar.createVolumeSlider($("#slider").offset().left, $("#slider").offset().top - 8, $("#slider").width(), 30, 2); // origin x, origin y, width, height, index
		seekbar.showVolumeSlider(2);

		seekbar.onSliderChanged(function(percentageDragged) {
			if (util.getCurrentDevice().shortname == "MCE") {
				var duration = $("#timespanright").attr("data-duration");
				if (util.isNumeric(duration)) {
					percentageDragged = percentageDragged / 100;
					var seekTo = Math.floor(duration * percentageDragged);
					//$(this).attr("data-sendval", seekTo);
					sliders.sendSeekEvent(seekTo);
					//slideTimer = setTimeout(doSeekEvent, 500);
				}
			}
		}, 2);

		/* volume control */
		var volumebar = window.plugins.volumeSlider;
		volumebar.createVolumeSlider($("#VolumeSlider").offset().left, $("#VolumeSlider").offset().top - 8, $("#VolumeSlider").width(), 30, 1); // origin x, origin y, width, height, index
		volumebar.showVolumeSlider(1);

		volumebar.onSliderDragged(function(percentageDragged) {
			var MaxVolumeJump = 20;
			var seekTo = Math.round(MaxVolumeJump - (MaxVolumeJump * (percentageDragged / 100)));
			var sendval = 0;
			if (seekTo >= (MaxVolumeJump / 2)) {
				//down
				sendval = (seekTo - (MaxVolumeJump / 2));
				if (sendval > 0) {
					$("#hud").text("-" + sendval + "x").show();
				}
			} else {
				// Up	
				sendval = ((MaxVolumeJump / 2) - seekTo);
				if (sendval > 0) {
					$("#hud").text("+" + sendval + "x").show();
				}
			}
		}, 1);
		volumebar.onSliderChanged(function(percentageDragged) {
			console.log(percentageDragged);
			var MaxVolumeJump = 20;
			var seekTo = Math.round(MaxVolumeJump - (MaxVolumeJump * (percentageDragged / 100)));
			var sendval = 0;
			if (seekTo >= (MaxVolumeJump / 2)) {
				//down
				sendval = (seekTo - (MaxVolumeJump / 2));
				if (sendval > 0) {
					sliders.sendVolumeChange(sendval, "VolumeDown");
					volumebar.setVolumeSlider(50, 1);
					$("#hud").hide();
				}
			} else {
				// Up	
				sendval = ((MaxVolumeJump / 2) - seekTo);
				if (sendval > 0) {
					sliders.sendVolumeChange(sendval, "VolumeUp");
					volumebar.setVolumeSlider(50, 1);
					$("#hud").hide();
				}
			}
		}, 1);

		volumebar.setVolumeSlider(50, 1);
		seekbar.setVolumeSlider(0, 2);

	},
	sendVolumeChange: function(val, command) {
		appendOncetoQueryString = "&" + val;
		gestures.executeGestureByCommandName(command);
	},
	sendSeekEvent: function(seek) {
		var device = util.getCurrentDevice();
		if (device.shortname != "MCE") {
			return;
		}
		var base = util.getMBUrl() + "ui?command=seek&value=" + seek + "&controllerName=" + $("#timespanright").attr("data-controller");
		$.getJSON(base, function() {
			setTimeout(function() {
				ui.queryNowPlaying();
			}, 1500);
		});
	},
	resetVolumeSlider: function() {
		var s = window.plugins.volumeSlider;
		s.setVolumeSlider(50, 1);
	},
	setNPSeek: function(x) {
		var s = window.plugins.volumeSlider;
		s.setVolumeSlider(x, 2);
	},
	resetNPSeek: function() {
		var s = window.plugins.volumeSlider;
		//s.setVolumeSlider(0, 2);
		$("#timespanleft").text("0:00");
		$("#timespanright").text("- 0:00");
	},
	resize: function() {
		setTimeout(function() {
			var s = window.plugins.volumeSlider;
			s.resize($("#VolumeSlider").offset().left, $("#VolumeSlider").offset().top - 8, $("#VolumeSlider").width(), 30, 1); // origin x, origin y, width, height, index
			s.resize($("#slider").offset().left, $("#slider").offset().top - 8, $("#slider").width(), 30, 2); // origin x, origin y, width, height, index
		}, 250);

	}
};