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
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var parseJsonResults = function(x) {

			if (x.Data.Name == "StartupFolder") {
				MediaBrowser.createInitialListView();
				return;
			}
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
			util.doHud({
				show: false
			});
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
			switch (item.folderType) {
				case "Genres":
					MediaBrowser.showListOfGenres();
					break;
				case "Years":
					MediaBrowser.showListOfYears();
					break;
				case "Actors":
					MediaBrowser.showListOfActors();
					break;
				case "Directors":
					MediaBrowser.showListOfDirectors();
					break;
				case "OfficialRating":
					MediaBrowser.showListOfRating();
					break;
				case "IMDBRating":
					MediaBrowser.showListOfIMDBRating();
					break;
				case "Unwatched":
					MediaBrowser.showListOfUnwatched();
					break;
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
	createInitialListView: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var parseJsonResults = function(d) {
			//parse the StartUp Folder
			var tableView = [];
			$.each(d.Data.Children, function(key, val) {
				tableView.push({
					'textLabel': d.Data.Children[key].Name,
					'detailTextLabel': "" + d.Data.Children[key].ChildCount + " total, " + d.Data.Children[key].UnwatchedCount + " not watched, " + d.Data.Children[key].RecentlyAddedUnplayedItemCount + " new",
					'icon': "greyarrow",
					'sectionHeader': "Folders",
					'guid': d.Data.Children[key].Id,
					'type': d.Data.Children[key].Type,
					'imdb': d.Data.Children[key].ImdbRating
				});
			});

			if (Object.keys(geniusResults.Titles).length > 0) {
				tableView.push({
					'textLabel': 'Genres',
					'detailTextLabel': "Movies Separated By Genre",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'Genres'
				});
				tableView.push({
					'textLabel': 'Rating',
					'detailTextLabel': "Movies sorted by IMDB Rating",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'IMDBRating'
				});
				tableView.push({
					'textLabel': 'Release Year',
					'detailTextLabel': "Movies Separated By Production Year",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'Years'
				});
				tableView.push({
					'textLabel': 'Unwatched',
					'detailTextLabel': "Movies that have not been watched",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'Unwatched'
				});
				tableView.push({
					'textLabel': 'Actors',
					'detailTextLabel': "Movie Actors",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'Actors'
				});
				tableView.push({
					'textLabel': 'Directors',
					'detailTextLabel': "Movie Directors",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'Directors'
				});
				tableView.push({
					'textLabel': 'MPAA Rating',
					'detailTextLabel': "Official rating by the MPAA",
					'icon': "greyarrow",
					'sectionHeader': "Categories",
					'type': 'CustomFolder',
					'folderType': 'OfficialRating'
				});
			}

			var nt = window.plugins.NativeTable;
			nt.createTable({
				'height': $(window).height(),
				'showSearchBar': true,
				'showNavBar': true,
				'navTitle': "Movies",
				'navBarColor': 'black',
				'showRightButton': true,
				'RightButtonText': 'Close',
				'showBackButton': false
			});
			nt.onRightButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.setRowSelectCallBackFunction(function(rowId) {
				var item = tableView[rowId];
				nt.hideTable(function() {
					util.doHud({
						show: true,
						labelText: "Loading Data...",
						detailsLabelText: "Please Wait..."
					});
					setTimeout(function() {
						MediaBrowser.ShowItems(item);
					}, 250);
				});
			});
			nt.setTableData(tableView);
			util.doHud({
				show: false
			});
			nt.showTable(function() {});
		};
		var getJsonFromServer = function(MBUrl, parse) {
			if (util.isWifi() === false) {
				if (parse) {
					util.doAlert("You are not on Wifi and no cached version exists. To do this, connect to Wifi and try again");
					$("#btnTitles").trigger("click");
					return;
				}
			}
			$.ajax({
				url: MBUrl,
				dataType: 'json',
				timeout: settings.MBServiceTimeout,
				success: function(d) {
					cache.saveJson(MBUrl, d);
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
		var MBUrl = util.getMBUrl();
		MBUrl += "library/";
		cache.getJson(MBUrl, function(d) {
			if (d === null) {
				getJsonFromServer(MBUrl, true);
			} else {
				parseJsonResults(d); //display cached
				getJsonFromServer(MBUrl, false); //get from server, to replace cache but dont parse
			}
		});
	},
	createCustomTable: function(tableView, tableTitle, backButtonCallback, itemSelectCallback) {
		var nt = window.plugins.NativeTable;
		nt.createTable({
			'height': $(window).height(),
			'showSearchBar': true,
			'showNavBar': true,
			'navTitle': tableTitle,
			'navBarColor': 'black',
			'showRightButton': true,
			'RightButtonText': 'Close',
			'showBackButton': true
		});
		nt.onRightButtonTap(function() {
			nt.hideTable(function() {});
		});
		nt.setRowSelectCallBackFunction(function(rowId) {
			itemSelectCallback(rowId, nt);
		});

		nt.onBackButtonTap(function() {
			nt.hideTable(function() {
				backButtonCallback();
			});
		});

		nt.setTableData(tableView);
		util.doHud({
			show: false
		});
		nt.showTable(function() {});
	},
	showListOfYears: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var ProductionYears = [];
		$.each(geniusResults.Titles, function(idx, item) {
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
		tableView.sort(util.dynamicSort("-textLabel"));
		MediaBrowser.createCustomTable(tableView, "Years", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByYear(item.textLabel);
			});
		});
	},
	showListOfMoviesByYear: function(year) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		$.each(geniusResults.Titles, function(idx, item) {
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

		MediaBrowser.createCustomTable(tableView, year, function() {
			MediaBrowser.showListOfYears();
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	showListOfGenres: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var Genres = [];
		$.each(geniusResults.Titles, function(idx, item) {
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
		MediaBrowser.createCustomTable(tableView, "Genres", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByGenre(item.textLabel);
			});
		});
	},
	showListOfMoviesByGenre: function(genre) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		$.each(geniusResults.Titles, function(idx, item) {
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

		MediaBrowser.createCustomTable(tableView, genre, function() {
			MediaBrowser.showListOfGenres();
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	showListOfActors: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var Actors = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.Actors) {
				for (var i = 0; i < item.Actors.length; i++) {
					if ($.trim(item.Actors[i].Name) !== "" && item.Actors[i].Name !== null) {
						if (jQuery.inArray(item.Actors[i].Name, Actors) == -1) {
							Actors.push(item.Actors[i].Name);
							var LastThenFirstName = item.Actors[i].Name.split(" ").pop().replace(/[^a-zA-Z 0-9]+/g, '');
							LastThenFirstName += ", " + item.Actors[i].Name.split(" ")[0].replace(/[^a-zA-Z 0-9]+/g, '');
							if (LastThenFirstName.length > 4) {
								tableView.push({
									'textLabel': LastThenFirstName,
									'detailTextLabel': "",
									'icon': "greyarrow",
									'sectionHeader': LastThenFirstName.substring(0, 1).toUpperCase(),
									'type': 'CustomFolder',
									'folderType': 'Actors',
									'customSort': LastThenFirstName,
									'ActualName': item.Actors[i].Name
								});
							}
						}
					}
				}
			}
		});
		Actors = null;
		if (tableView.length === 0) {
			util.doAlert("No Actors found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
			return;
		}
		tableView.sort(util.dynamicSort("customSort"));
		MediaBrowser.createCustomTable(tableView, "Actors", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByActor(item.ActualName);
			});
		});
	},
	showListOfMoviesByActor: function(actor) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.Actors) {
				for (var i = 0; i < item.Actors.length; i++) {
					if (item.Actors[i].Name == actor) {
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
			util.doAlert("No movies found for this actor.");
			return;
		}
		tableView.sort(util.dynamicSort("sortName"));

		MediaBrowser.createCustomTable(tableView, actor, function() {
			MediaBrowser.showListOfActors();
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	showListOfDirectors: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var Directors = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.Directors) {
				for (var i = 0; i < item.Directors.length; i++) {
					if ($.trim(item.Directors[i]) !== "" && item.Directors[i] !== null) {
						if (jQuery.inArray(item.Directors[i], Directors) == -1) {
							Directors.push(item.Directors[i]);
							var LastThenFirstName = item.Directors[i].split(" ").pop().replace(/[^a-zA-Z 0-9]+/g, '');
							LastThenFirstName += ", " + item.Directors[i].split(" ")[0].replace(/[^a-zA-Z 0-9]+/g, '');
							if (LastThenFirstName.length > 4) {
								tableView.push({
									'textLabel': LastThenFirstName,
									'detailTextLabel': "",
									'icon': "greyarrow",
									'sectionHeader': LastThenFirstName.substring(0, 1).toUpperCase(),
									'type': 'CustomFolder',
									'folderType': 'Directors',
									'customSort': LastThenFirstName,
									'ActualName': item.Directors[i]
								});
							}
						}
					}
				}
			}
		});
		Directors = null;
		if (tableView.length === 0) {
			util.doAlert("No Directors found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
			return;
		}
		tableView.sort(util.dynamicSort("customSort"));
		MediaBrowser.createCustomTable(tableView, "Directors", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByDirector(item.ActualName);
			});
		});
	},
	showListOfMoviesByDirector: function(Director) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.Directors) {
				for (var i = 0; i < item.Directors.length; i++) {
					if (item.Directors[i] == Director) {
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
			util.doAlert("No movies found for this Director.");
			return;
		}
		tableView.sort(util.dynamicSort("sortName"));

		MediaBrowser.createCustomTable(tableView, Director, function() {
			MediaBrowser.showListOfDirectors();
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	showListOfRating: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var OfficialRatings = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.OfficialRating !== "" && item.OfficialRating !== null) {
				if (jQuery.inArray(item.OfficialRating, OfficialRatings) == -1) {
					OfficialRatings.push(item.OfficialRating);
					tableView.push({
						'textLabel': item.OfficialRating.toString(),
						'detailTextLabel': "Movies Rated: " + item.OfficialRating,
						'icon': "greyarrow",
						'sectionHeader': "Movies By MPAA Rating",
						'type': 'CustomFolder',
						'folderType': 'Rating'
					});
				}
			}
		});

		OfficialRatings = null;
		if (tableView.length === 0) {
			util.doAlert("No Ratings found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
			return;
		}
		tableView.sort(util.dynamicSort("textLabel"));
		MediaBrowser.createCustomTable(tableView, "Rating", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByRating(item.textLabel);
			});
		});
	},
	showListOfMoviesByRating: function(OfficialRating) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.OfficialRating == OfficialRating) {
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
			util.doAlert("No movies found for this rating.");
			return;
		}
		tableView.sort(util.dynamicSort("sortName"));

		MediaBrowser.createCustomTable(tableView, OfficialRating, function() {
			MediaBrowser.showListOfRating();
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	showListOfIMDBRating: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var ImdbRatings = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (util.isNumeric(item.ImdbRating) && item.ImdbRating > 0) {
				var imdbRating = Math.floor(item.ImdbRating);
				if (jQuery.inArray(imdbRating, ImdbRatings) == -1) {
					ImdbRatings.push(imdbRating);
					tableView.push({
						'textLabel': imdbRating + " stars",
						'detailTextLabel': "Movies with greater or equal to " + imdbRating + " stars",
						'icon': "greyarrow",
						'sectionHeader': "Movies By Rank",
						'type': 'CustomFolder',
						'folderType': 'imdbRating',
						'imdbRating': imdbRating.toString(),
						'sortOn': (imdbRating < 10 ? '0' : '') + imdbRating
					});
				}
			}
		});

		ImdbRatings = null;
		if (tableView.length === 0) {
			util.doAlert("No imdb ratings found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
			return;
		}
		tableView.sort(util.dynamicSort("-sortOn"));
		MediaBrowser.createCustomTable(tableView, "Rating", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			nt.hideTable(function() {
				MediaBrowser.showListOfMoviesByIMDBRating(item.imdbRating);
			});
		});
	},
	showListOfMoviesByIMDBRating: function(rating) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		rating = parseInt(rating, 10);
		$.each(geniusResults.Titles, function(idx, item) {
			if (util.isNumeric(item.ImdbRating) && item.ImdbRating > 0) {
				var imdbRating = Math.floor(item.ImdbRating);
				if (imdbRating == rating) {
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

		});
		if (tableView.length === 0) {
			util.doAlert("No movies found for this rating.");
			return;
		}
		tableView.sort(util.dynamicSort("sortName"));

		MediaBrowser.createCustomTable(tableView, rating.toString, function() {
			MediaBrowser.showListOfIMDBRating();
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	showListOfUnwatched: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		$.each(geniusResults.Titles, function(idx, item) {
			if (item.WatchedPercentage === 0) {
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
			util.doAlert("No unwatched movies found.");
			return;
		}
		tableView.sort(util.dynamicSort("sortName"));

		MediaBrowser.createCustomTable(tableView, "Unwatched", function() {
			$("#btnTitles").trigger("click");
		}, function(x, nt) {
			var item = tableView[x];
			var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
			MediaBrowser.playTitle($(tr), item.textLabel, false);
		});
	},
	startWorker: function(firstRun) {

		var refreshIn = 2880; //2 days
		var current = new Date();
		var lastSeen = util.getItem("lastRefresh");
		if (lastSeen === null) {
			lastSeen = new Date("2010-01-01T23:44:52.790Z");
		} else {
			lastSeen = new Date(lastSeen);
		}
		var minutesSinceLastRefresh = (current.getTime() - lastSeen.getTime()) / 60000;
		var needsRefresh = false;

		if (minutesSinceLastRefresh > refreshIn) {
			needsRefresh = true;
		}

		if (firstRun === true && needsRefresh === false) {
			//just load the pull the results from cache
			console.log("First run, no refresh");
			cache.getJson("genius", function(d) {
				if (d !== null) {
					geniusResults = d;
				}
			});
			return;
		}

		if (firstRun === false && needsRefresh === false) {
			console.log("no refresh needed");
			return;
		}

		//start out by pulling the root folders, ans adding them to the queue
		cache.getJson("genius", function(d) {

			if (d !== null) {
				geniusResults = d;
			}

			//clear the queue
			geniusResults.refreshQueue = [];
			geniusResults.TitlesQueue = [];
			$.ajaxq("genuisWorker");

			util.setItem("lastRefresh", new Date().toISOString());

			util.setStatusBarMessage("Searching for new titles");
			$.ajax({
				url: util.getRandomMBServer() + "library?lightData=1",
				dataType: 'json',
				timeout: settings.userSettings.MBServiceTimeout,
				success: function(d) {
					$.each(d.Data.Children, function(key, val) {
						var item = d.Data.Children[key];
						if (item.Type == "Folder") {
							geniusResults.refreshQueue.push({
								Id: item.Id,
								title: item.Name
							});
						}
					});
					//console.log(geniusResults.refreshQueue);
					util.setStatusBarMessage("Searching " + geniusResults.refreshQueue.length + " folders for new titles");
					cache.saveJson("genius", geniusResults);
					MediaBrowser.processGeniusQueue();
				}
			});
		});
	},
	processGeniusQueue: function() {
		if (geniusResults.refreshQueue.length > 0) {
			//Pull the last folder and queue up all children
			var toProcess = geniusResults.refreshQueue[geniusResults.refreshQueue.length - 1];
			util.setStatusBarMessage("Processing " + toProcess.title);
			var thisURL = util.getRandomMBServer() + "library?lightData=1&Id=" + toProcess.Id;
			console.log(thisURL);
			$.ajax({
				url: thisURL,
				dataType: 'json',
				timeout: settings.userSettings.MBServiceTimeout,
				success: function(d) {
					var foundOne = false;
					if (d.Data) {
						$.each(d.Data.Children, function(x) {
							var thisObj = d.Data.Children[x];
							var thisId = thisObj.Id;
							if (thisObj.Type == "Movie") {
								if (!geniusResults.Titles[thisId]) { //doesnt have prev saved metadata
									if (!geniusResults.TitlesQueue[thisId]) { //is not in current queue
										foundOne = true;
										geniusResults.TitlesQueue[thisId] = {};
										$.ajaxq("genuisWorker", {
											url: util.getRandomMBServer() + "library/?Id=" + thisId + "&lightData=0",
											dataType: 'json',
											timeout: settings.userSettings.MBServiceTimeout,
											success: function(x) {
												MediaBrowser.saveGeniusResult(x);
											},
											error: function() {
												console.log("error");
												delete geniusResults.TitlesQueue[thisId];
											}
										});
									}
								}
							}
						});
					} else {
						console.log("no data in response.");
					}

					if (foundOne === false) {
						//console.log("nothing new");
						util.setStatusBarMessage(toProcess.title + " Completed");
						geniusResults.refreshQueue.pop();
						MediaBrowser.processGeniusQueue();
					}
				},
				error: function() {
					console.log("process error");
				}
			});
		} else {
			util.setStatusBarMessage("All Titles Indexed.");
			setTimeout(function() {
				util.setStatusBarForceClear();
			}, 1500);
		}
	},
	saveGeniusResult: function(d) {
		var movieObject = d.Data;
		var id = movieObject.Id;

		//save it
		geniusResults.Titles[id] = movieObject;
		//remove it from queue
		delete geniusResults.TitlesQueue[id];

		var remaining = Object.keys(geniusResults.TitlesQueue).length;
		if (remaining % 50 === 0) { //alert the user, and save results every 50 items
			//save to disk
			cache.saveJson("genius", geniusResults);
			var parentFolder = "";
			//try to get the name of the parent folder
			$.each(geniusResults.refreshQueue, function(x) {
				if (geniusResults.refreshQueue[x].Id == movieObject.parentId) {
					parentFolder = geniusResults.refreshQueue[x].title;
				}
			});
			util.setStatusBarMessage("Indexing " + remaining + " " + parentFolder + " Titles");
		}

		if (remaining % 25 === 0) { //clear the status every 25 items
			util.setStatusBarForceClear();
		}

		if (remaining === 0) {
			//folder was totally indexed, do next
			geniusResults.refreshQueue.pop();
			cache.saveJson("genius", geniusResults);
			MediaBrowser.processGeniusQueue();
		}
	}

};