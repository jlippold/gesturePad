var bottomDraw = {
	bind: function() {
		var hscrollTimer = null;
		$("#boxCoverContainer").bind("scroll", function() {
			clearTimeout(hscrollTimer);
			hscrollTimer = setTimeout(function() {
				var device = util.getCurrentDevice();
				if (device.shortname != "MCE") {
					return;
				}
				var areaWidth = $(this).width();
				$("#covers > div.pendingImg").each(function() {
					var left = $(this).offset().left;
					var width = $(this).width();
					var visible = false;
					if (left + width < 0) {
						//console.log( $(this).find("p").text() +  'this div is obfuscated above the viewable area');
						visible = false;
					} else if (left > areaWidth) {
						//console.log($(this).find("p").text() + 'this div is obfuscated below the viewable area')
						visible = false;
					} else {
						//console.log($(this).find("p").text() + 'this div is at least partially in view');
						visible = true;
					}
					if (visible === true) {
						//console.log($(this).find("p:first").text());
						$(this).removeClass("pendingImg");
						var boxImg = $(this).find("img");
						var guid = $(boxImg).attr("data-guid");
						var prefix = $(boxImg).attr("data-prefix");
						var imgID = "MB_Small_" + guid;
						$(boxImg).onerror = function() {
							$(this).attr("src", "img/nobox.png");
						};
						cache.getImage({
							id: imgID,
							url: prefix + guid + "&maxwidth=120&maxheight=120"
						}, function(r) {
							var img = new Image();
							img.onerror = function() {
								$(boxImg).attr("src", "img/nobox.png");
							};
							if (r.cached === false) {
								img.onload = function() {
									cache.saveImage({
										id: imgID,
										img: img
									});
									//console.log("no cache")
									$(boxImg).attr("src", r.url);
								};
								img.src = r.url;
							} else {
								//console.log("using Cached: " + r.url.substring(0, 100) );
								$(boxImg).attr("src", r.url);
							}
						});
					}
				});
			}, 200);
		});
		$("#boxCoverContainer").bind("touchmove touchend", function(e) {
			window.scrollTo(0, 0);
		});
		$("#boxCoverBack").fastClick(function() {
			if ($("#covers").data("back") !== "") {
				if ($("#covers").data("back") == "ChannelHome") {
					bottomDraw.showBottomItems();
				} else {
					var tr = $("<a data-guid='" + $("#covers").data("back") + "' data-type='Folder' data-backwards='1' />");
					bottomDraw.showBottomItems(tr);
				}
			}
		});
		$("#bottomGrabberKILL").bind("touchstart", function(e) {
			var s = window.plugins.volumeSlider;
			s.hideVolumeSlider(1);
			var lastY = e.originalEvent.touches[0].screenY;
			$(this).data('lastY', e.originalEvent.touches[0].screenY);
		});
		$("#bottomGrabberKILL").bind("touchmove", function(e) {
			e.stopImmediatePropagation();
			e.preventDefault();
			var orig = e.originalEvent.targetTouches[0];
			var lastY = parseInt($(this).data('lastY'), 10);
			var position = parseInt($("#bottom").css("bottom"), 10);
			var maxHeight = 140;
			var n = 0;
			var bOffset = -140;
			$(this).data('lastY', orig.pageY);
			if (lastY < orig.screenY) {
				n = position - (orig.pageY - lastY);
				if (n <= maxHeight && n >= 0) {
					$("#bottom").css("bottom", n + "px");
					$("#browser").css("bottom", (bOffset + n) + "px");
				}
			} else {
				n = position + (lastY - orig.pageY);
				if (n <= maxHeight && n >= 0) {
					$("#bottom").css("bottom", n + "px");
					$("#browser").css("bottom", (bOffset + n) + "px");
				}
			}

		});
		$("#bottomGrabberKILL").bind("touchend", function(e) {
			sliders.resize();
			setTimeout(function() {
				bottomDraw.refreshBottomDrawer();
			}, 100);
			setTimeout(function() {
				var s = window.plugins.volumeSlider;
				s.showVolumeSlider(1);
			}, 250);
		});
	},
	showBottomItems: function(tr, sentEventType) {
		var eventType = "click";
		if (sentEventType) {
			eventType = sentEventType;
		}
		var device = util.getCurrentDevice();
		var boxCoverWidth = 70;
		var backwards = false;
		var animationProps = {
			"startCoverOpacity": 0.25,
			"startCoverTop": "140px",
			"endCoverOpacity": 1,
			"endCoverTop": "24px"
		};
		if (device.shortname == "MCE") {
			var MBUrl = util.getMBUrl();
			if (tr) {
				if ($(tr).attr("data-type") == "Movie" || $(tr).attr("data-type") == "Episode") {
					if (eventType == "taphold") {
						MediaBrowser.playTitle($(tr), $(tr).parent().find("p").text(), false);
					} else {
						MediaBrowser.playTitle($(tr), $(tr).parent().find("p").text(), true);
					}
					return;
				}
				if ($(tr).hasAttr("data-backwards")) {
					backwards = true;
				}
			}
			if (backwards) {
				animationProps = {
					"startCoverOpacity": 0.25,
					"startCoverTop": "-164px",
					"endCoverOpacity": 1,
					"endCoverTop": "24px"
				};
			}
			$('#covers').animate({
				"opacity": animationProps.startCoverOpacity,
				"margin-top": animationProps.startCoverTop
			}, 250, function() {
				$("#covers").css("margin-top", "24px").width($(window).width());
				$("#covers").html("<div class='boxLoader'><p class='boxLoading'>Loading Data...</p></div>").css("opacity", "1").hide().fadeIn();
				var parseJsonResults = function(x) {
					var tb = '<div style="width: 40px; height: 100%; float:left"> </div>';
					$("#covers").width(((x.Data.Children.length) * boxCoverWidth) + 50);
					if (settings.moviesByDate && x.Data.Type == "Folder") {
						x.Data.Children.sort(function(a, b) {
							return Date.parse(b.DateCreated) - Date.parse(a.DateCreated);
						});
					}
					if (settings.userSettings.tvByDate && (x.Data.Type == "Season" || x.Data.Type == "Series")) {
						x.Data.Children.sort(function(a, b) {
							return Date.parse(b.DateCreated) - Date.parse(a.DateCreated);
						});
					}
					$.each(x.Data.Children, function(key, val) {
						tb += '<div class="smallboxContainer pendingImg" >';
						if (x.Data.Children[key].IsFolder === true) {
							if (x.Data.Children[key].RecentlyAddedUnplayedItemCount > 0) {
								tb += '<div class="badge" >' + x.Data.Children[key].RecentlyAddedUnplayedItemCount + '</div>';
							}
						}
						tb += '<img data-prefix="' + util.getMBUrl() + 'image/?Id=' + '" data-guid="' + x.Data.Children[key].Id + '" data-type="' + x.Data.Children[key].Type + '" class="smallBox" src="img/nobox.png"  data-imdb="' + ((x.Data.Children[key].ImdbRating > 0) ? "1" : "0") + '" />';
						tb += '<p>' + x.Data.Children[key].Name + '</p>';
						tb += '</div>';
					});
					var children = $("<div>" + tb + "</div>");
					$(children).find("div.pendingImg").each(function(counter) {
						if (counter > 100) {
							return false;
						}
						var boxImg = $(this).find("img");
						var guid = $(boxImg).attr("data-guid");
						var prefix = $(boxImg).attr("data-prefix");
						var imgID = "MB_Small_" + guid;
						$(boxImg).onerror = function() {
							$(this).attr("src", "img/nobox.png");
						};
						//load data with cached imagery already populated
						cache.getImage({
							id: imgID,
							url: prefix + guid + "&maxwidth=120&maxheight=120"
						}, function(r) {
							var img = new Image();
							img.onerror = function() {
								$(boxImg).attr("src", "img/nobox.png");
							};
							if (r.cached) {
								$(boxImg).attr("src", r.url);
								$(this).removeClass("pendingImg");
							}
						});
					});
					$('#covers').css("margin-top", "-130px").css("opacity", "0.25");
					$("#covers").empty().append($(children).children());
					$("#covers img").each(function() {
						var itemType = $(this).attr("data-type");
						if (itemType == "Movie" || itemType == "Episode") {

							$(this).longclick(function(evt) {
								bottomDraw.showBottomItems(evt.currentTarget, "taphold");
							}, 750);

							$(this).bind("click", function() {
								bottomDraw.showBottomItems($(this));
							});
						} else {
							$(this).bind("click", function() {
								$("#boxCoverBack").data("scrollPosition", $("#boxCoverContainer").scrollLeft());
								bottomDraw.showBottomItems($(this));
							});
						}
					});
					$('#covers').animate({
						"opacity": animationProps.endCoverOpacity,
						"margin-top": animationProps.endCoverTop
					}, 250, function() {
						if ($("#boxCoverBack").data("scrollPosition") && backwards) {
							$("#boxCoverContainer").animate({
								scrollLeft: parseInt($("#boxCoverBack").data("scrollPosition"), 10)
							}, 500);
						}
						$("#boxCoverContainer").trigger("scroll");
						var folderName = x.Data.Name;
						if (folderName == "StartupFolder") {
							folderName = "Startup Folder";
							$("#covers").data("back", "");
						} else {
							$("#covers").data("back", x.Data.parentId);
						}
						$("#covers").data("loaded", true);
						$('#bottomText > span:first').animate({
							"opacity": 0,
							"margin-left": '-100px'
						}, 250, function() {
							$("#bottomText > span:first").text(folderName);
							$("#bottomText > span:first").animate({
								"opacity": 1,
								"margin-left": '0px'
							}, 250);
						});
					});
				};
				var getJsonFromServer = function(url, parse) {
					if (util.isWifi() === false && parse) {
						util.doAlert("Sorry, you are not on Wifi, and this data is yet to be cached.");
						$("#covers").html("<div class='boxLoader'><p class='boxLoading'>No data found.</p></div>");
						return;
					}
					$.ajax({
						url: url,
						dataType: 'json',
						timeout: settings.MBServiceTimeout,
						success: function(d) {
							cache.saveJson(url, d);
							if (parse) {
								parseJsonResults(d);
							}
						},
						error: function() {
							if (parse) {
								util.doAlert("The server is not responding in time, and no cached version exists. Try again later");
								$("#covers").html("<div class='boxLoader'><p class='boxLoading'>No data found.</p></div>");
							}
						}
					});
				};
				if (tr) {
					MBUrl += "library/?lightData=1&Id=" + $(tr).attr("data-guid");
				} else {
					MBUrl += "library/";
				}
				cache.getJson(MBUrl, function(d) {
					if (d === null) {
						//get from server
						getJsonFromServer(MBUrl, true);
					} else {
						//display cached
						parseJsonResults(d);
						//get from server, to replace cache but dont parse
						getJsonFromServer(MBUrl, false);
					}
				});
			});
		}
		if (device.shortname == "DTV") {
			if (tr) {
				if ($(tr).attr("data-type") == "Movie" || $(tr).attr("data-type") == "Episode") {
					MediaBrowser.playTitle($(tr), $(tr).parent().find("p").text());
					return;
				}
				if ($(tr).hasAttr("data-backwards")) {
					backwards = true;
				}
			}
			animationProps = {
				"startCoverOpacity": 0.25,
				"startCoverTop": "140px",
				"endCoverOpacity": 1,
				"endCoverTop": "24px"
			};
			if (backwards) {
				animationProps = {
					"startCoverOpacity": 0.25,
					"startCoverTop": "-164px",
					"endCoverOpacity": 1,
					"endCoverTop": "24px"
				};
			}
			$('#covers').animate({
				"opacity": animationProps.startCoverOpacity,
				"margin-top": animationProps.startCoverTop
			}, 250, function() {
				$("#covers").css("margin-top", "24px").width($(window).width());
				$("#covers").html("<div class='boxLoader'><p class='boxLoading'>Loading Data...</p></div>").css("opacity", "1").hide().fadeIn();
				var tb = '<div style="width: 40px; height: 100%; float:left"> </div>';
				if (tr) {
					//load a group
					var category = $(tr).attr("data-category");
					var i = 0;
					$.each(guide.channels, function(channelKey, c) {
						if (c.category == category) {
							tb += '<div class="smallboxContainer" >';
							tb += '<div class="channelContainer"><div data-minor="' + c.number + '" class="smallChannel" style="background-image: url(' + c.logo + ')" ></div></div>';
							tb += '<p>' + c.fullname + '</p>';
							tb += '</div>';
							i++;
						}
					});
					$("#covers").width(((i) * boxCoverWidth) + 50);
				} else {
					//get channel categories
					var categories = [];
					$.each(guide.channels, function(channelKey, c) {
						var chanObject = {
							category: c.category,
							logo: c.logo,
							name: c.fullname
						};
						var blnFound = false;
						$.each(categories, function(x, y) {
							if (y.category == c.category) {
								blnFound = true;
								return false;
							}
						});
						if (blnFound === false) {
							categories.push(chanObject);
						}
					});
					$.each(categories, function(x, y) {
						tb += '<div class="smallboxContainer" >';
						tb += '<div class="channelContainer"><div data-category="' + y.category + '" class="smallChannel" style="background-image: url(' + y.logo + ')" ></div></div>';
						tb += '<p>' + y.category + '</p>';
						tb += '</div>';
					});
					$("#covers").width(((categories.length) * boxCoverWidth) + 50);
				}
				var children = $("<div>" + tb + "</div>");
				$('#covers').css("margin-top", "-130px").css("opacity", "0.25");
				$("#covers").empty().append($(children).children());
				$("#covers div.smallChannel").fastClick(function() {
					if ($(this).hasAttr("data-category")) {
						$("#boxCoverBack").data("scrollPosition", $("#boxCoverContainer").scrollLeft());
						bottomDraw.showBottomItems($(this));
					} else {
						//change to the channel
						DirecTV.changeChannel($(this).attr("data-minor"));
					}
				});
				$('#covers').animate({
					"opacity": animationProps.endCoverOpacity,
					"margin-top": animationProps.endCoverTop
				}, 250, function() {
					if ($("#boxCoverBack").data("scrollPosition") && backwards) {
						$("#boxCoverContainer").animate({
							scrollLeft: parseInt($("#boxCoverBack").data("scrollPosition"), 10)
						}, 500);
					}
					var folderName = "Categories";
					if (tr) {
						$("#covers").data("back", "ChannelHome");
						folderName = $(tr).attr("data-category");
					} else {
						$("#covers").data("back", "");
					}
					$("#covers").data("loaded", true);
					$('#bottomText > span:first').animate({
						"opacity": 0,
						"margin-left": '-100px'
					}, 250, function() {
						$("#bottomText > span:first").text(folderName);
						$("#bottomText > span:first").animate({
							"opacity": 1,
							"margin-left": '0px'
						}, 250);
					});
				});
			});
		}
	},
	refreshBottomDrawer: function() {
		var maxHeight = 140;
		var position = parseInt($("#bottom").css("bottom"), 10);
		if (position > (maxHeight / 3)) { //more than 1/3 up push to top
			$("#bottom").animate({
				bottom: "140px"
			}, {
				duration: 200,
				queue: false
			});
			$("#browser").animate({
				bottom: "-1px"
			}, {
				duration: 200,
				queue: false,
				complete: function() {
					if (($("#covers").data("back") === "" || $("#covers").data("back") === undefined) && ($("#covers").data("loaded") === false || $("#covers").data("loaded") === undefined)) {
						bottomDraw.showBottomItems();
					}
				}
			});
		} else {
			$("#bottom").animate({
				bottom: "0px"
			}, {
				duration: 200,
				queue: false
			});
			$("#browser").animate({
				bottom: "-140px"
			}, {
				duration: 200,
				queue: false,
				complete: function() {
					if (($("#covers").data("back") === "" || $("#covers").data("back") === undefined)) {
						$("#covers").data("loaded", false);
						$("#bottomText span").html("&nbsp;");
						$("#covers").html("&nbsp;");
					}
				}
			});
		}
	},
	updateBottomContents: function() {
		$("#covers").data("back", "");
		$("#covers").data("loaded", false);
		$("#bottomText span").html("&nbsp;");
		$("#covers").html("&nbsp;");
		bottomDraw.refreshBottomDrawer();
	}
};