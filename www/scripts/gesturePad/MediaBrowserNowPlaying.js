var NowPlayingChannels = [];
var geniusResults = {};
var MediaBrowserNowPlaying = {
	xmlChannels: null,
	allItemsPopulated: false,
	seekAttempts: 0,
	generateAllItems: function() {

		if (MediaBrowserNowPlaying.allItemsPopulated === true) {
			return;
		}

		util.doHud({
			show: false
		});

		util.doHud({
			show: true,
			labelText: "Generating Channels",
			detailsLabelText: "For first use..."
		});

		var xml = MediaBrowserNowPlaying.xmlChannels;
		var NowPlayingMatchingItemsForChannel = [];

		//create the channels
		NowPlayingChannels.length = 0;
		$(xml).find('nowplaying > channel').each(function(idx) {
			var channel = $(this);
			var maxItems = parseInt($(channel).attr("items"), 10);
			for (var i = 0; i < maxItems; i++) {
				var objChannel = {};
				objChannel.Title = $(channel).attr("title");
				objChannel.node = $(this);
				objChannel.idx = idx;
				objChannel.UpNext = [];
				NowPlayingChannels.push(objChannel);
			}
			NowPlayingMatchingItemsForChannel.push({
				AllItems: []
			});
		});

		//build the rules for the channels
		var ruleSet = MediaBrowserNowPlaying.buildJSRuleSet();
		MediaBrowser.loadGeniusResults(function(geniusResults) {

			//loop each title and place them into channels
			$.each(geniusResults.Titles, function(k, item) {

				//clear outcomes
				$.each(ruleSet, function(idx) {
					ruleSet[idx].match = false;
					$.each(ruleSet[idx].rules, function(i) {
						ruleSet[idx].rules[i].match = false;
						$.each(ruleSet[idx].rules[i].criteria, function(x) {
							ruleSet[idx].rules[i].criteria[x].match = false;
						});
					});
				});

				//loop each channel
				$.each(NowPlayingChannels, function(idx) {
					var channel = NowPlayingChannels[idx];
					//first loop lowest level rules and mark if matched
					$.each(ruleSet[idx].rules, function(y) {
						$.each(ruleSet[idx].rules[y].criteria, function(x) {
							ruleSet[idx].rules[y].criteria[x].match = MediaBrowserNowPlaying.doesItemMeetRule(item, ruleSet[idx].rules[y].criteria[x].field, ruleSet[idx].rules[y].criteria[x].operator, ruleSet[idx].rules[y].criteria[x].val);
						});
					});

					//mark the rule as matched if all childred are matched
					$.each(ruleSet[idx].rules, function(y) {
						var allMatched = true;
						$.each(ruleSet[idx].rules[y].criteria, function(x) {
							if (ruleSet[idx].rules[y].criteria[x].match === false) {
								allMatched = false;
							}
						});
						ruleSet[idx].rules[y].match = allMatched;
					});

					//mark the whole thing as true if any ruleset is true
					$.each(ruleSet[idx].rules, function(y) {
						$.each(ruleSet[idx].rules[y].criteria, function(x) {
							if (ruleSet[idx].rules[y].match === true) {
								ruleSet[idx].match = true;
							}
						});
					});

					//finally add the item if thw whole ruleset is true
					if (ruleSet[idx].match === true) {

						var HD = "";
						if (item.MediaInfo) {
							if (item.MediaInfo.Height) {
								if (item.MediaInfo.Height >= 550) {
									HD = " [HD]";
								}
							}
						}

						if (item.MediaType) {
							if (item.MediaType == "Mkv") {
								HD = " [HD]";
							}
						}

						NowPlayingMatchingItemsForChannel[channel.idx].AllItems.push({
							Id: item.Id,
							title: item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : "") + HD,
							runtime: MediaBrowserNowPlaying.getRuntime(item)
						});
					}

				});
			});

		});

		//shuffle the titles
		$.each(NowPlayingMatchingItemsForChannel, function(idx) {
			NowPlayingMatchingItemsForChannel[idx].AllItems = util.shuffle(NowPlayingMatchingItemsForChannel[idx].AllItems);
			NowPlayingMatchingItemsForChannel[idx].position = -1;
		});

		cache.saveJson("NowPlayingMatchingItemsForChannel", NowPlayingMatchingItemsForChannel);
		MediaBrowserNowPlaying.allItemsPopulated = true;
	},
	generateChannels: function() {

		cache.getJson("NowPlayingMatchingItemsForChannel", function(NowPlayingMatchingItemsForChannel) {
			//MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(NowPlayingChannels, function(idx) {
				var channel = NowPlayingChannels[idx];

				//remove items that have ended
				channel.UpNext = $.grep(channel.UpNext, function(el, i) {
					var timeslot = channel.UpNext[i];
					if ((new Date()) > timeslot.ends) { //over
						return false;
					} else {
						return true;
					}
				});

				//add in now playing items to minimize duplicates
				if (channel.UpNext.length === 0) {

					var chanIndex = channel.idx;
					var arrPosition = NowPlayingMatchingItemsForChannel[chanIndex].position;
					arrPosition += 1;
					if ((arrPosition + 1) > NowPlayingMatchingItemsForChannel[chanIndex].AllItems.length) {
						NowPlayingMatchingItemsForChannel[chanIndex].AllItems = util.shuffle(NowPlayingMatchingItemsForChannel[chanIndex].AllItems);
						arrPosition = 0;
					}
					NowPlayingMatchingItemsForChannel[chanIndex].position = arrPosition;

					var runtime = NowPlayingMatchingItemsForChannel[chanIndex].AllItems[arrPosition].runtime;
					var startPosition = 0;
					if (channel.UpNext.length === 0) { //generate random starting position for the nowplaying item
						startPosition = util.randomFromInterval(0, runtime - 10);
					}

					var timeslot = {};
					timeslot.starts = util.addMinutes(new Date(), (startPosition * -1.0));
					timeslot.ends = util.addMinutes(timeslot.starts, runtime);
					timeslot.title = NowPlayingMatchingItemsForChannel[chanIndex].AllItems[arrPosition].title;
					timeslot.Id = NowPlayingMatchingItemsForChannel[chanIndex].AllItems[arrPosition].Id;

					channel.UpNext.push(timeslot);

				}

			});

			$.each(NowPlayingChannels, function(idx) {
				var maxFutureItems = 3;
				var channel = NowPlayingChannels[idx];

				//add in up next items
				if (channel.UpNext.length < maxFutureItems) {

					for (var k = channel.UpNext.length; k <= maxFutureItems; k++) {
						var chanIndex = channel.idx;
						var arrPosition = NowPlayingMatchingItemsForChannel[chanIndex].position;
						arrPosition += 1;
						if ((arrPosition + 1) > NowPlayingMatchingItemsForChannel[chanIndex].AllItems.length) {
							NowPlayingMatchingItemsForChannel[chanIndex].AllItems = util.shuffle(NowPlayingMatchingItemsForChannel[chanIndex].AllItems);
							arrPosition = 0;
						}
						NowPlayingMatchingItemsForChannel[chanIndex].position = arrPosition;

						var runtime = NowPlayingMatchingItemsForChannel[chanIndex].AllItems[arrPosition].runtime;
						var startPosition = 0;
						if (channel.UpNext.length === 0) { //generate random starting position for the nowplaying item
							startPosition = util.randomFromInterval(0, runtime - 10);
						}

						var timeslot = {};
						timeslot.starts = util.addMinutes(new Date(), (startPosition * -1.0));
						timeslot.ends = util.addMinutes(timeslot.starts, runtime);
						timeslot.title = NowPlayingMatchingItemsForChannel[chanIndex].AllItems[arrPosition].title;
						timeslot.Id = NowPlayingMatchingItemsForChannel[chanIndex].AllItems[arrPosition].Id;

						channel.UpNext.push(timeslot);

					}

				}
			});
			//});

			cache.saveJson("NowPlayingMatchingItemsForChannel", NowPlayingMatchingItemsForChannel);
		});
	},
	buildListView: function() {

		if (MediaBrowserNowPlaying.xmlChannels === null) {
			MediaBrowserNowPlaying.loadChannels(function() {
				MediaBrowserNowPlaying.buildListView();
			});
			return;
		}

		MediaBrowserNowPlaying.generateAllItems();
		MediaBrowserNowPlaying.generateChannels();

		var tableView = [];
		//MediaBrowser.loadGeniusResults(function(geniusResults) {
		cache.getJson("NowPlayingMatchingItemsForChannel", function(NowPlayingMatchingItemsForChannel) {

			$.each(NowPlayingChannels, function(idx) {
				var channel = NowPlayingChannels[idx];
				if (NowPlayingMatchingItemsForChannel[channel.idx].AllItems.length <= 1 || channel.UpNext.length <= 1) {
					return true;
				}
				var timeslot = channel.UpNext[0];
				var nextTimeSlot = channel.UpNext[1];
				var timeLeft = Math.floor((Math.abs(timeslot.ends - (new Date())) / 1000) / 60).toString();

				tableView.push({
					'textLabel': timeslot.title,
					'detailTextLabel': "Time Left: " + timeLeft + " minutes \nUp Next: " + nextTimeSlot.title,
					'icon': "none",
					'image': util.getRandomMBServer() + "image/?Id=" + timeslot.Id + "&maxwidth=120&maxheight=120",
					'sectionHeader': channel.Title,
					'guid': timeslot.Id,
					'imdb': '',
					'sortName': '',
					'ends': timeslot.ends
				});

			});

			var nt = window.plugins.NativeTable;
			nt.createTable({
				'height': $(window).height(),
				'showSearchBar': true,
				'showNavBar': true,
				'navTitle': "Now Playing",
				'navBarColor': 'black',
				'showRightButton': true,
				'RightButtonText': 'Close',
				'showBackButton': true,
				'showToolBar': true,
				'MediaBrowserToolBar': true
			});

			nt.onToolbarButtonClick(function(buttonIndex) {
				MediaBrowser.toolbarButtonClickEvent(buttonIndex, nt);
			});

			nt.onRightButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.onBackButtonTap(function() {
				nt.hideTable(function() {
					MediaBrowser.createInitialListView();
				});
			});

			nt.setRowSelectCallBackFunction(function(rowId) {
				var ending = Date.parse(tableView[rowId].ends);
				util.doHud({
					show: true,
					labelText: "Playing Title...",
					detailsLabelText: "Tap to cancel",
					tappedEvent: function() {
						MediaBrowserNowPlaying.seekAttempts = 99;
						util.doHud({
							show: false
						});
					}
				});
				var MBUrl = util.getMBUrl();
				MBUrl += "ui?command=play&id=" + tableView[rowId].guid;
				$.getJSON(MBUrl, function(x) {
					setTimeout(function() {
						MediaBrowserNowPlaying.seekAttempts = 0;
						MediaBrowserNowPlaying.doSeek(ending);
					}, 1500);
				});
			});

			nt.setTableData(tableView);
			util.doHud({
				show: false
			});
			nt.showTable(function() {});
		});
		//});

	},
	getRuntime: function(item) {
		var runtime = 0;
		try {
			if (item.MediaInfo) {
				if (item.MediaInfo.RunTime) {
					if (util.isNumeric(item.MediaInfo.RunTime)) {
						if (item.MediaInfo.RunTime > 10) {
							runtime = item.MediaInfo.RunTime;
						}
					}
				}
			}
		} catch (e) {
			runtime = 0;
		}
		return runtime;
	},
	compareArrayOfString: function(arr, operator, value) {
		var match = false;
		switch (operator) {
			case "equals":
				for (i = 0; i < arr.length; i++) {
					if (arr[i] === value) {
						match = true;
					}
				}
				break;
			case "first":
				if (arr.length >= 1) {
					if (arr[0] === value) {
						match = true;
					}
				}
				break;
			case "contains":
				for (i = 0; i < arr.length; i++) {
					if (arr[i].indexOf(value) > -1) {
						match = true;
					}
				}
				break;
			case "not":
				var isMatch = false;
				for (i = 0; i < arr.length; i++) {
					if (arr[i] == value) {
						isMatch = true;
					}
				}
				if (isMatch === false) {
					match = true;
				}
				break;
			default:
				match = false;
		}
		return match;
	},
	compareIntegers: function(against, operator, value) {
		var match = false;
		value = parseFloat(value, 10);
		against = parseFloat(against, 10);

		switch (operator) {
			case "equals":
				if (against === value) {
					match = true;
				}
				break;
			case "greaterthan":
				if (against >= value) {
					match = true;
				}
				break;
			case "lessthan":
				if (against <= value) {
					match = true;
				}
				break;
			default:
				match = false;
		}
		return match;
	},
	compareStrings: function(against, operator, value) {
		var match = false;
		value = value.toLowerCase();
		against = against.toLowerCase();
		switch (operator) {
			case "equals":
				if (value === against) {
					match = true;
				}
				break;
			case "not":
				if (value !== against) {
					match = true;
				}
				break;
			case "contains":
				if (against.indexOf(value) > -1) {
					match = true;
				}
				break;
			case "notcontains":
				if (against.indexOf(value) === -1) {
					match = true;
				}
				break;
			default:
				match = false;
		}
		return match;
	},
	doesItemMeetRule: function(item, field, operator, value) {
		var match = false;
		if (MediaBrowserNowPlaying.getRuntime(item) === 0) {
			return false;
		}
		switch (field) {
			//string arrays
			case "Genre":
				if (item.Genres) {
					match = MediaBrowserNowPlaying.compareArrayOfString(item.Genres, operator, value);
				}
				break;
			case "Actor":
				if (item.Actors) {
					var arr = [];
					for (i = 0; i < item.Actors.length; i++) {
						arr.push(item.Actors[i].Name);
					}
					match = MediaBrowserNowPlaying.compareArrayOfString(arr, operator, value);
				}
				break;
			case "Director":
				if (item.Directors) {
					match = MediaBrowserNowPlaying.compareArrayOfString(item.Directors, operator, value);
				}
				break;
			case "Studios":
				if (item.Studios) {
					match = MediaBrowserNowPlaying.compareArrayOfString(item.Studios, operator, value);
				}
				break;
				//integers
			case "Rating":
				if (item.ImdbRating) {
					match = MediaBrowserNowPlaying.compareIntegers(item.ImdbRating, operator, value);
				}
				break;
			case "ProductionYearAge":
				if (item.ProductionYear) {
					if (item.ProductionYear.toString().length === 4) {
						var age = ((new Date().getFullYear()) - item.ProductionYear);
						match = MediaBrowserNowPlaying.compareIntegers(age, operator, value);
					}
				}
				break;
			case "ProductionYear":
				if (item.ProductionYear) {
					match = MediaBrowserNowPlaying.compareIntegers(item.ProductionYear, operator, value);
				}
				break;
			case "FileDateAge":
				if (item.DateCreated) {
					var EDT = Date.parse(item.DateCreated);
					if (!isNaN(EDT)) {
						var daysOld = (new Date() - EDT) / 86400000;
						match = MediaBrowserNowPlaying.compareIntegers(daysOld, operator, value);
					}
				}
				break;
			case "Folder":
				if (item.Path) {
					if (item.Path.lastIndexOf("\\") > 0) {
						match = MediaBrowserNowPlaying.compareStrings(item.Path.substring(0, item.Path.lastIndexOf("\\")), operator, value);
					} else {
						if (item.Path.lastIndexOf("/") > 0) {
							match = MediaBrowserNowPlaying.compareStrings(item.Path.substring(0, item.Path.lastIndexOf("/")), operator, value);
						}
					}
				}
				break;
			default:
				match = false;
		}
		return match;
	},
	buildJSRuleSet: function() {
		var ruleSet = [];
		$.each(NowPlayingChannels, function(idx) {
			var channel = NowPlayingChannels[idx];
			ruleSet.push({
				match: false,
				rules: []
			});
			$(channel.node).find("ruleSet").each(function() {
				var rule = {
					criteria: [],
					match: false
				};

				$(this).find("rule").each(function() {
					var crit = {};
					crit.field = $(this).attr("field");
					crit.val = $(this).find("value:first").text();
					crit.operator = $(this).find("compare:first").text();
					crit.match = false;
					rule.criteria.push(crit);
				});
				ruleSet[idx].rules.push(rule);
			});
		});
		return ruleSet;
	},
	loadChannels: function(callback) {
		var xmlLoc = "xml/nowplaying.xml?r=" + Math.random();
		$.ajax({
			type: "GET",
			url: xmlLoc,
			dataType: "xml",
			success: function(xml) {
				MediaBrowserNowPlaying.xmlChannels = xml;
				callback();
			},
			error: function() {
				//util.doAlert("Error loading channel list: " + xmlLoc);
			}
		});
	},
	doSeek: function(ending) {
		$.ajax({
			url: util.getMBUrl() + "ui",
			dataType: "json",
			timeout: 10000,
			success: function(j) {
				if (j.Data.PlayingControllers.length >= 1) {

					$("#timespanright").attr("data-duration", j.Data.PlayingControllers[0].CurrentFileDuration.Ticks);
					$("#timespanright").attr("data-controller", j.Data.PlayingControllers[0].ControllerName);
					$("#NowPlayingTitle").text(j.Data.PlayingControllers[0].PlayableItems[0].DisplayName);

					var duration = j.Data.PlayingControllers[0].CurrentFileDuration.TotalSeconds;
					var ticks = j.Data.PlayingControllers[0].CurrentFileDuration.Ticks;
					var secondsLeft = duration - ((Math.abs(ending - (new Date())) / 1000));
					var jumptoPercentage = (secondsLeft / duration);
					var newposition = Math.floor(jumptoPercentage * ticks);
					var currentPercentage = (j.Data.PlayingControllers[0].CurrentFilePosition.Ticks / ticks);

					if (isNaN(jumptoPercentage)) {
						setTimeout(function() {
							MediaBrowserNowPlaying.doSeek(ending);
						}, 1500);
						return;
					}
					if (Math.abs(jumptoPercentage - currentPercentage) < 0.03) {
						//jumped successfully
						ui.queryNowPlaying();
						util.doHud({
							show: false
						});
						MediaBrowserNowPlaying.seekAttempts = 0;
					} else {

						//not at the right position
						sliders.sendSeekEvent(newposition);
						setTimeout(function() {
							if (MediaBrowserNowPlaying.seekAttempts < 3) {
								MediaBrowserNowPlaying.doSeek(ending);
							}
							MediaBrowserNowPlaying.seekAttempts += 1;
						}, 1500);
					}
				}
			}
		});
	}
};