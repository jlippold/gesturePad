jQuery.gestures = {};
(function($) {
	var canvas;
	var active = false;
	var recording = false;
	var previous = {
		x: 0,
		y: 0
	};
	var chain = [];
	var retGesture = null;
	var fingers = 1;
	var isTap = true;
	var tapcount = 0;
	var xStart = 0;
	var xEnd = 0;
	var yStart = 0;
	var yEnd = 0;

	function exec(chain) {
		if (chain.length && retGesture) {
			var toReturn = chain.join('.');
			if (toReturn == "R") {
				if ((xEnd - xStart) > HorzLongSwipeThreshold) {
					toReturn = "LS" + toReturn;
				}
			}
			if (toReturn == "L") {
				if ((xStart - xEnd) > HorzLongSwipeThreshold) {
					toReturn = "LS" + toReturn;
				}
			}
			if (toReturn == "U") {
				if ((yStart - yEnd) > VertLongSwipeThreshold) {
					toReturn = "LS" + toReturn;
				}
			}
			if (toReturn == "D") {
				if ((yEnd - yStart) > VertLongSwipeThreshold) {
					toReturn = "LS" + toReturn;
				}
			}
			retGesture(fingers + "." + toReturn);
		}
	}

	function get_last_move(previous, cur) {
		var diff = {
			x: cur.x - previous.x,
			y: cur.y - previous.y
		};
		var mv = null;
		if (Math.abs(diff.x) > Math.abs(diff.y)) {
			if (diff.x <= -10) mv = 'L';
			if (diff.x >= 10) mv = 'R';
		} else {
			if (diff.y <= -10) mv = 'U';
			if (diff.y >= 10) mv = 'D';
		}
		return mv;
	}

	function drawline(previous, cur) {
		//console.log(previous);
		isTap = false;
		var context = document.getElementById('gestures_canvas').getContext('2d');
		context.strokeStyle = "#E5E5E5";
		context.lineCap = "round";
		context.lineJoin = "round";
		context.shadowColor = 'rgba(237,234,234,0.2)';
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 2;
		context.shadowBlur = 10;
		context.lineWidth = 4;
		context.beginPath();
		var off = $("#gestures_canvas").offset().top;
		context.moveTo(previous.x, previous.y - off);
		context.lineTo(cur.x, cur.y - off);
		context.closePath();
		context.stroke();
		if (xStart === 0) {
			xStart = previous.x;
		}
		if (yStart === 0) {
			yStart = previous.y - off;
		}
		xEnd = previous.x;
		yEnd = previous.y - off;
	}

	function setup() {
		if (active) {
			recording = false;
			chain = [];
			//clear canvas
			var context = document.getElementById('gestures_canvas').getContext('2d');
			context.save();
			context.setTransform(1, 0, 0, 1, 0, 0);
			context.clearRect(0, 0, canvas.width(), canvas.height());
			context.restore();
		}
	}
	$.gestures.init = function(ob) {
		ob = $.extend(ob, {
			active: true
		});
		canvas = $('#gestures_canvas');
		$(window).resize(setup);
		// capturing gestures
		$(canvas).bind("mousedown touchstart", function(e) {
			if (e.currentTarget.id != "gestures_canvas") {
				return;
			}
			chain = [];
			xStart = 0;
			xEnd = 0;
			yStart = 0;
			yEnd = 0;
			$.gestures.enable();
			if (active) {
				recording = true;
				if (e.type == "mousedown") {
					previous = {
						x: e.clientX,
						y: e.clientY
					};
				} else {
					previous = {
						x: e.originalEvent.pageX,
						y: e.originalEvent.pageY
					};
					fingers = e.originalEvent.touches.length;
					isTap = true;
				}
			}
		});
		$(canvas).bind("mousemove touchmove", function(e) {
			if (e.currentTarget.id != "gestures_canvas") {
				return;
			}
			if (active && recording) {
				var pos = {};
				if (e.type == "mousemove") {
					pos = {
						x: e.clientX,
						y: e.clientY
					};
				} else {
					pos = {
						x: e.originalEvent.pageX,
						y: e.originalEvent.pageY
					};
				}
				drawline(previous, pos);
				var mv = get_last_move(previous, pos);
				if (mv !== null) {
					if (chain[chain.length - 1] != mv) {
						chain.push(mv);
					}
				}
				if (e.type == "mousemove") {
					previous = {
						x: e.clientX,
						y: e.clientY
					};
				} else {
					previous = {
						x: e.originalEvent.pageX,
						y: e.originalEvent.pageY
					};
				}
			}
			e.preventDefault();
			return false;
		});
		$(canvas).bind("mouseup touchend", function(e) {
			if (e.currentTarget.id != "gestures_canvas") {
				return;
			}
			if (active && recording) {
				if (isTap) {
					node = $(this);
					tapcount++;
					if (tapcount == 1) {
						setTimeout(function() {
							var c = [];
							if (tapcount == 1) {
								c.push("Tap");
								exec(c);
							} else {
								c.push("DblTap");
								exec(c);
							}
							tapcount = 0;
						}, 300);
					}
				} else {
					var c = chain;
					setup();
					exec(c);
					return;
				}
			}
		});
		// setting the observer
		if (ob.active) $.gestures.enable();
		else $.gestures.disable();
	};
	$.gestures.retGesture = function(fun) {
		retGesture = fun;
	};
	$.gestures.enable = function() {
		active = true;
		setup();
	};
	$.gestures.disable = function() {
		active = false;
		$(canvas).hide();
	};
	$.gestures.active = function() {
		return active;
	};
})(jQuery);

(function($) {
	$.fn.longclick = function(callback, timeout) {
		var isIPad = true;
		var startEvents = isIPad ? "touchstart" : "mousedown";
		var endEvents = isIPad ? "touchend touchcancel" : "mouseup";
		$(this).bind(startEvents, function(event) {
			// save the initial event object
			var initialEvent = event;
			//var initialElement = $(this);
			// set delay after which the callback will be called
			var timer = window.setTimeout(function() {
				callback(initialEvent);
			}, timeout);
			// bind to global event(s) for clearance
			$(document).bind(endEvents, function() {
				// clear timer
				window.clearTimeout(timer);
				// reset global event handlers
				$(document).unbind(endEvents);
				return true;
				// use 'return false;' if you need to prevent default handler and
				// stop event bubbling
			});
			return true;
			// use 'return false;' if you need to prevent default handler and
			// stop event bubbling
		});
	};
})(jQuery);