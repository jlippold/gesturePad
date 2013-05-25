var sliders = {
	bindSliders: function() {
		$("#VolumeSliderSeek").bind("touchmove", function(event) {
			event.preventDefault();
			clearTimeout(slideTimer);
			var e = event.originalEvent;
			var touch = e.touches[0];
			var max = $("#VolumeSlider").width();
			var x = touch.pageX - 50;
			if (x > max) {
				x = max;
			}
			var percentageDragged = x / max;
			var left = (x - 10);
			if (left < 0) {
				left = 0;
			}
			$("#VolumeSliderSeek").attr("style", "left: " + left + "px");
			$("#VolumeSliderh").attr("style", "width: " + Math.floor(percentageDragged * 100) + "%");
			var MaxVolumeJump = 20;
			var seekTo = Math.round(MaxVolumeJump - (MaxVolumeJump * percentageDragged));
			var sendval = 0;
			if (seekTo >= (MaxVolumeJump / 2)) {
				//down
				sendval = (seekTo - (MaxVolumeJump / 2));
				if (sendval > 0) {
					$("#VolumeContainer").attr("data-command", "VolumeDown");
					$("#VolumeContainer").attr("data-sendval", sendval);
					if (sendval < 3) {
						$("#hud").hide();
						$("#VolumeContainer").attr("data-sendval", "0");
					} else {
						$("#hud").text("-" + sendval + "x").show();
					}
				}
			} else {
				// Up	
				sendval = ((MaxVolumeJump / 2) - seekTo);
				if (sendval > 0) {
					$("#VolumeContainer").attr("data-command", "VolumeUp");
					$("#VolumeContainer").attr("data-sendval", sendval);
					if (sendval < 3) {
						$("#hud").hide();
						$("#VolumeContainer").attr("data-sendval", "0");
					} else {
						$("#hud").text("+" + sendval + "x").show();
					}
				}
			}
		});
		$("#VolumeSliderSeek").bind("touchend", function(event) {
			if ($("#VolumeContainer").attr("data-sendval") != "0") {
				sliders.doSlideEvent();
			} else {
				sliders.resetVolumeSlider();
			}
		});
		$("#seekbarContainer").bind("touchmove", function(event) {
			clearTimeout(slideTimer);
			if (util.getCurrentDevice().shortname == "MCE") {
				event.preventDefault();
				var e = event.originalEvent;
				var touch = e.touches[0];
				var max = $("#slider").width();
				var x = touch.pageX - 50;
				if (x > max) {
					x = max;
				}
				var duration = $("#timespanright").attr("data-duration");
				if (util.isNumeric(duration)) {
					var percentageDragged = x / max;
					$("#timeseek").attr("style", "left: " + (x - 10) + "px");
					$("#timebar").attr("style", "width: " + Math.floor(percentageDragged * 100) + "%");
					var seekTo = Math.floor(duration * percentageDragged);
					$(this).attr("data-sendval", seekTo);
					//slideTimer = setTimeout(doSeekEvent, 500);
				}
			}
		});
		$("#seekbarContainer").bind("touchend", function(event) {
			sliders.doSeekEvent();
		});
	},
	doSeekEvent: function() {
		var device = util.getCurrentDevice();
		if (device.shortname != "MCE") {
			return;
		}
		var seek = $("#seekbarContainer").attr("data-sendval");
		var base = util.getMBUrl() + "ui?command=seek&value=" + seek + "&controllerName=" + $("#timespanright").attr("data-controller");
		$.getJSON(base, function() {
			setTimeout(function() {
				ui.queryNowPlaying();
			}, 1500);
		});
	},
	doSlideEvent: function() {
		appendOncetoQueryString = "&" + $("#VolumeContainer").attr("data-sendval");
		gestures.executeGestureByCommandName($("#VolumeContainer").attr("data-command"));
		sliders.resetVolumeSlider();
	},
	resetNPSeek: function() {
		$("#timeseek").attr("style", "left: " + ($("#timebar").width() - 10) + "px");
	},
	resetVolumeSlider: function() {
		//set volume slider at center
		var max = $("#VolumeSlider").width();
		var x = max * 0.5;
		$("#hud").fadeOut();
		$("#VolumeSliderSeek").attr("style", "left: " + (x - 10) + "px");
		$("#VolumeSliderh").attr("style", "width: " + ((x / max) * 100) + "%");
	}
};