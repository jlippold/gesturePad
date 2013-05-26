var MediaBrowser = {
	playByID: function(buttonIndex, id) {
		if (buttonIndex == 2) {
			DoShuffle();
		}
		if (buttonIndex == 1) {
			var MBUrl = util.getMBUrl();
			MBUrl += "ui?command=play&id=" + id;
			$.getJSON(MBUrl, function(x) {
				setTimeout(function() {
					ui.queryNowPlaying();
				}, 1500);
			});
		}
	},
	playTitle: function(tr, movieTitle, playNow) {
		if (util.isWifi() === false) {
			util.doAlert("You are not on Wifi. To play this title, connect to Wifi and try again");
			return;
		}
		var MBUrl = util.getMBUrl();
		var guid = "";
		if (playNow) {
			guid = $(tr).attr("data-guid");
			MBUrl += "ui?command=play&id=" + guid;
			$.getJSON(MBUrl, function() {
				setTimeout(function() {
					ui.queryNowPlaying();
				}, 1500);
			});
			util.doAlert("Now Playing\n" + movieTitle);
		} else {
			var actionSheet = window.plugins.actionSheet;
			var actions = ["Play", "Resume", "View on Screen"];
			if ($(tr).attr("data-imdb") == "1") {
				actions.push("View Imdb Page");
			}
			actions.push("Cancel");
			guid = $(tr).attr("data-guid");
			var title = "Actions";
			if (title !== undefined) {
				title = movieTitle;
			}
			actionSheet.create({
				title: title,
				items: actions,
				destructiveButtonIndex: (actions.length - 1)
			}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1 || buttonIndex == (actions.length - 1)) {
					return;
				}
				switch (actions[buttonIndex]) {
					case "Play":
						MBUrl += "ui?command=play&id=" + guid;
						break;
					case "Resume":
						MBUrl += "ui?command=resume&id=" + guid;
						break;
					case "View on Screen":
						MBUrl += "ui?command=navigatetoitem&id=" + guid;
						break;
					case "View Imdb Page":
						MBUrl = "";
						break;
				}
				if (MBUrl !== "") {
					$.getJSON(MBUrl, function() {
						setTimeout(function() {
							ui.queryNowPlaying();
						}, 1500);
					});
				} else {
					//launch Imdb
					$.ajax({
						url: util.getMBUrl() + "library/?Id=" + guid + "&lightData=1",
						dataType: 'json',
						timeout: settings.userSettings.MBServiceTimeout,
						success: function(x) {
							if (x.Data.ImdbID) {
								cb = window.plugins.childBrowser;
								if (cb !== null) {
									cb.showWebPage("http://m.imdb.com/title/" + x.Data.ImdbID);
								}
							} else {
								util.doAlert("Sorry, This title does not have an IMBD id");
							}
						},
						error: function() {
							if (parse) {
								util.doAlert("The server is not responding in time, and no cached version exists. Try again later");
							}
						}
					});
				}
			});
		}
	},
	ShowItems: function(item, sentEventType) {
		var eventType = "click";
		if (sentEventType) {
			eventType = sentEventType;
		}
		var MBUrl = util.getMBUrl();
		var parseJsonResults = function(x) {
			var tableView = [];
			if (settings.userSettings.moviesByDate && (x.Data.Type == "Folder" || x.Data.Type == "FavoriteFolder")) {
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
				if (x.Data.Children[key].Type == "Folder" || x.Data.Children[key].Type == "Season" || x.Data.Children[key].Type == "Series" || x.Data.Children[key].Type == "FavoriteFolder") {
					tableView.push({
						'textLabel': x.Data.Children[key].Name,
						'detailTextLabel': "" + x.Data.Children[key].ChildCount + " total, " + (x.Data.Children[key].UnwatchedCount ? x.Data.Children[key].UnwatchedCount + " not watched, " : "") + x.Data.Children[key].RecentlyAddedUnplayedItemCount + " new",
						'icon': "greyarrow",
						'sectionHeader': x.Data.Name == "StartupFolder" ? 'Folders' : x.Data.Children[0].Type,
						'guid': x.Data.Children[key].Id,
						'type': x.Data.Children[key].Type,
						'imdb': ((x.Data.Children[key].ImdbRating > 0) ? "1" : "0")
					});
				} else {
					tableView.push({
						'textLabel': (x.Data.Children[key].WatchedPercentage === 0 ? "🔹 " : "") + x.Data.Children[key].Name + ((x.Data.Children[key].ProductionYear) ? " (" + x.Data.Children[key].ProductionYear + ")" : ""),
						'detailTextLabel': (x.Data.Children[key].ImdbRating ? x.Data.Children[key].ImdbRating + "/10 " : "") + (x.Data.Children[key].TagLine ? x.Data.Children[key].TagLine : ""),
						'icon': "none",
						'sectionHeader': x.Data.Name == "StartupFolder" ? 'Folders' : x.Data.Children[0].Type,
						'guid': x.Data.Children[key].Id,
						'type': x.Data.Children[key].Type,
						'imdb': ((x.Data.Children[key].ImdbRating > 0) ? "1" : "0")
					});
				}
			});
			var nt = window.plugins.NativeTable;
			nt.createTable({
				'height': $(window).height(),
				'showSearchBar': true,
				'showNavBar': true,
				'navTitle': x.Data.Name == "StartupFolder" ? 'Folders' : x.Data.Name,
				'navBarColor': 'black',
				'showRightButton': true,
				'RightButtonText': 'Close',
				'showBackButton': x.Data.Name != "StartupFolder" ? true : false
			});
			nt.onRightButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.setRowSelectCallBackFunction(function(rowId) {
				var item = tableView[rowId];
				if (item.icon == "none") {
					var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
					MediaBrowser.playTitle($(tr), item.textLabel, false);
				} else {
					nt.hideTable(function() {
						MediaBrowser.ShowItems(item);
					});
				}
			});
			if (x.Data.Name == "StartupFolder") {
				nt.onBackButtonTap(function() {});
			} else {
				nt.onBackButtonTap(function() {
					nt.hideTable(function() {
						MediaBrowser.ShowItems({
							'type': 'Folder',
							'guid': x.Data.parentId
						});
					});
				});
			}
			nt.setTableData(tableView);
			nt.showTable(function() {});
		};
		var getJsonFromServer = function(MBUrl, parse) {
			if (util.isWifi() === false && parse) {
				util.doAlert("Sorry, you are not on Wifi, and this data is yet to be cached.");
				return;
			}
			$.ajax({
				url: MBUrl,
				dataType: 'json',
				timeout: settings.userSettings.MBServiceTimeout,
				success: function(d) {
					if (d.Data !== null) {
						cache.saveJson(MBUrl, d);
					}
					if (parse) {
						parseJsonResults(d);
					}
				},
				error: function() {
					if (parse) {
						util.doAlert("The server is not responding in time, and no cached version exists. Try again later");
					}
				}
			});
		};
		if (item.type == "CustomFolder") {
			if (item.folderType == "Genres") {
				MediaBrowser.showListOfGenres();
			}
			if (item.folderType == "Years") {
				MediaBrowser.showListOfYears();
			}
		} else {
			MBUrl += "library/?lightData=1&Id=" + item.guid;
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
		}
	},

	showListOfYears: function() {
		var tableView = [];
		var ProductionYears = [];
		$.each(geniusResults.allItems, function(key, val) {
			var item = geniusResults.allItems[key];
			if (item.ProductionYear !== "" && item.ProductionYear !== null) {
				if (jQuery.inArray(item.ProductionYear, ProductionYears) == -1) {
					ProductionYears.push(item.ProductionYear);
					tableView.push({
						'textLabel': item.ProductionYear.toString(),
						'detailTextLabel': "Movies Released in " + item.ProductionYear,
						'icon': "greyarrow",
						'sectionHeader': "Movies By Year",
						'type': 'CustomFolder',
						'folderType': 'Years'
					});
				}
			}
		});

		ProductionYears = null;
		if (tableView.length === 0) {
			util.doAlert("No Years found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
			return;
		}

		tableView.sort(util.dynamicSort("textLabel"));
		var nt = window.plugins.NativeTable;
		nt.createTable({
			'height': $(window).height(),
			'showSearchBar': true,
			'showNavBar': true,
			'navTitle': 'Genres',
			'navBarColor': 'black',
			'showRightButton': true,
			'RightButtonText': 'Close',
			'showBackButton': true
		});
		nt.onRightButtonTap(function() {
			nt.hideTable(function() {});
		});
		nt.setRowSelectCallBackFunction(function(rowId) {
			var item = tableView[rowId];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByYear(item.textLabel);
			});
		});

		nt.onBackButtonTap(function() {
			nt.hideTable(function() {
				$("#btnTitles").trigger("click");
			});
		});

		nt.setTableData(tableView);
		nt.showTable(function() {});
	},
	showListOfMoviesByYear: function(year) {
		var tableView = [];
		$.each(geniusResults.allItems, function(key, val) {
			var item = geniusResults.allItems[key];
			if (item.ProductionYear == year) {
				tableView.push({
					'textLabel': (item.WatchedPercentage === 0 ? "🔹 " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
					'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
					'icon': "none",
					'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
					'guid': item.Id,
					'type': item.Type,
					'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
					'sortName': item.SortName
				});
			}
		});
		if (tableView.length === 0) {
			util.doAlert("No movies found for this year.");
			return;
		}

		tableView.sort(util.dynamicSort("sortName"));
		var nt = window.plugins.NativeTable;
		nt.createTable({
			'height': $(window).height(),
			'showSearchBar': true,
			'showNavBar': true,
			'navTitle': year + ' Movies',
			'navBarColor': 'black',
			'showRightButton': true,
			'RightButtonText': 'Close',
			'showBackButton': true
		});
		nt.onRightButtonTap(function() {
			nt.hideTable(function() {});
		});
		nt.setRowSelectCallBackFunction(function(rowId) {
			var item = tableView[rowId];
			nt.hideTable(function() {
				MediaBrowser.ShowItems(item);
			});
		});

		nt.onBackButtonTap(function() {
			nt.hideTable(function() {
				MediaBrowser.showListOfYears();
			});
		});

		nt.setTableData(tableView);
		nt.showTable(function() {});
	},
	showListOfGenres: function() {
		var tableView = [];
		var Genres = [];
		$.each(geniusResults.allItems, function(key, val) {
			var item = geniusResults.allItems[key];
			if (item.Genres) {
				for (var i = 0; i < item.Genres.length; i++) {
					if (item.Genres[i] !== "" && item.Genres[i] !== null) {
						if (jQuery.inArray(item.Genres[i], Genres) == -1) {
							Genres.push(item.Genres[i]);
							tableView.push({
								'textLabel': item.Genres[i],
								'detailTextLabel': "" + item.Genres[i] + " movies",
								'icon': "greyarrow",
								'sectionHeader': "Movies By Genre",
								'type': 'CustomFolder',
								'folderType': 'Genres'
							});
						}
					}
				}
			}
		});
		Genres = null;
		if (tableView.length === 0) {
			util.doAlert("No Genres found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
			return;
		}

		tableView.sort(util.dynamicSort("textLabel"));
		var nt = window.plugins.NativeTable;
		nt.createTable({
			'height': $(window).height(),
			'showSearchBar': true,
			'showNavBar': true,
			'navTitle': 'Genres',
			'navBarColor': 'black',
			'showRightButton': true,
			'RightButtonText': 'Close',
			'showBackButton': true
		});
		nt.onRightButtonTap(function() {
			nt.hideTable(function() {});
		});
		nt.setRowSelectCallBackFunction(function(rowId) {
			var item = tableView[rowId];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByGenre(item.textLabel);
			});
		});

		nt.onBackButtonTap(function() {
			nt.hideTable(function() {
				$("#btnTitles").trigger("click");
			});
		});

		nt.setTableData(tableView);
		nt.showTable(function() {});
	},
	showListOfMoviesByGenre: function(genre) {
		var tableView = [];
		$.each(geniusResults.allItems, function(key, val) {
			var item = geniusResults.allItems[key];
			if (item.Genres) {
				for (var i = 0; i < item.Genres.length; i++) {
					if (item.Genres[i] == genre) {
						tableView.push({
							'textLabel': (item.WatchedPercentage === 0 ? "🔹 " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
							'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
							'icon': "none",
							'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
							'guid': item.Id,
							'type': item.Type,
							'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
							'sortName': item.SortName
						});
					}
				}
			}
		});
		if (tableView.length === 0) {
			util.doAlert("No movies found for this genre.");
			return;
		}

		tableView.sort(util.dynamicSort("sortName"));
		var nt = window.plugins.NativeTable;
		nt.createTable({
			'height': $(window).height(),
			'showSearchBar': true,
			'showNavBar': true,
			'navTitle': genre + ' Movies',
			'navBarColor': 'black',
			'showRightButton': true,
			'RightButtonText': 'Close',
			'showBackButton': true
		});
		nt.onRightButtonTap(function() {
			nt.hideTable(function() {});
		});
		nt.setRowSelectCallBackFunction(function(rowId) {
			var item = tableView[rowId];
			nt.hideTable(function() {
				MediaBrowser.ShowItems(item);
			});
		});

		nt.onBackButtonTap(function() {
			nt.hideTable(function() {
				MediaBrowser.showListOfGenres();
			});
		});

		nt.setTableData(tableView);
		nt.showTable(function() {});
	},
	startWorker: function() {

		cache.getJson("genius", function(d) {
			if (d !== null) {
				geniusResults = d;
			}
			var MBUrl = util.getFirstMBServer();
			MBUrl += "library?lightData=0";
			console.log("making first genius request: " + MBUrl);
			/*
			$.ajax({
				url: MBUrl,
				dataType: 'json',
				timeout: 3000000,
				success: function(d) {
					console.log("first req successful");
					MediaBrowser.loopGeniusWorker(d);
				}
			});
			*/
		});
	},
	loopGeniusWorker: function(d) {
		var MBUrl = util.getFirstMBServer();
		var doesIdExist = function(source, searchID) {
			var exists = false;
			$.each(source, function(thisItem) {
				if (source[thisItem].Id == searchID) {
					exists = true;
					return false;
				}
			});
			return exists;
		};
		$.each(d.Data.Children, function(key, val) {
			var item = d.Data.Children[key];
			if (item.Type == "Movie") {
				console.log("Saving: " + item.Id);
				//save new items to geniusResults	
				if (doesIdExist(geniusResults.allItems) === false) {
					geniusResults.allItems.push(item);
					//console.log("Added: " + item.Id);
				} else {
					//console.log("Exists: " + item.Id);
				}
			}
		});
		cache.saveJson("genius", geniusResults);
		console.log("Saved genius");

		$.each(d.Data.Children, function(key, val) {
			var item = d.Data.Children[key];
			if (item.Type == "Folder") {
				console.log("Getting new folder: " + item.Id);
				//queue up the next ones
				$.ajaxq("geniusWorker", {
					url: MBUrl + "library?lightData=0&Id=" + item.Id,
					dataType: 'json',
					timeout: 3000000,
					success: function(d) {
						console.log("Looping new folder: " + item.Id);
						MediaBrowser.loopGeniusWorker(d);
					}
				});
			}
		});
	}
};