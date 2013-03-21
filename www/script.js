var xml;
var appendOncetoQueryString = "";
var navigator, npTimer, inputTimer, clickEventType, slideTimer;
var guide =  new Object();
var workerTimer = null;
var sleepTimer = null;
var scrollstop = null;

function loadSettings() {
	
	//defaults
	settings = {
		sounds: false,
		vibrate: false,
		SleepThreshold: 60000,
		MBServiceTimeout :120000,
		moviesByDate: false,
		tvByDate: false,
		configURL: "mbeg.xml",
		roomIndex: 0,
		deviceIndex: 0,
		rooms: []
	}

	//load from IOS prefs
	if ( isPhoneGap() ) {
		window.plugins.applicationPreferences.get('All', function(result) {
				var d = jQuery.parseJSON(result);

				//general settings
		        if ( d.sounds == 1 ) {
		        	settings.sounds = true;
		    	}
		        if ( d.vibrate == 1 ) {
		        	settings.vibrate = true;
		    	}
		        if ( d.dateMovies == 1 ) {
		        	settings.moviesByDate = true;
		    	}
		        if ( d.dateTV == 1 ) {
		        	settings.tvByDate = true;
		    	}

		    	//gesture XML
		        if ( d.config_source == 1 ) {
		        	settings.configURL = "mbeg.xml";
		    	} else {
					if ( d.config_source == 2 ) {
			        	settings.configURL = "mbegdt.xml";
			    	} else {
						if ( d.config_source == 3 ) {
				        	settings.configURL = d.custom_config;
				    	}
			    	}
		    	}

		    	//get rooms
		    	for (var i=1;i<=5;i++) {
		    		if ( d["S" + i + "_enabled"] ) {
		    			if ( d["S" + i + "_enabled"] == 1 ) {
		    				var room = {
		    					name: "Room " + i,
		    					index: (i-1),
		    					DTV: null,
		    					IR: false,
		    					devices: []
		    				};

		    				room.name = d["S" + i + "_RoomName"];
		    				
		    				room.devices.push({
		    					"name": "Movies", 
		    					"shortname": "MCE", 
		    					"IPAddress": d["S" + i + "_IP"],
		    					"Port": d["S" + i + "_EGPort"],
		    					"ServicePort": d["S" + i + "_MBPort"],
		    					"timeshift": true,
		    					"index": 0
		    				})

		    				if ( d["S" + i + "_DTV"] == 1 ) {
		    					room.DTV = d["S" + i + "_DTVIP"];
			    				room.devices.push({
			    					"name": "Television", 
			    					"shortname": "DTV", 
			    					"IPAddress": d["S" + i + "_DTVIP"],
			    					"Port": 8080,
			    					"timeshift": false,
			    					"index": 1
			    				})
		    				}

		    				if ( d["S" + i + "_EG"] == 1 ) {
		    					room.IR = true;
		    				}
		    				
		    				settings.rooms.push(room);
		    			}
		    			
		    		}
		    	}

		});
		
	} else {
		//push in a fake room, since it's a reg browser, for debugging
		settings = {"sounds":false,"vibrate":false,"SleepThreshold":60000,"MBServiceTimeout":120000,"moviesByDate":true,"tvByDate":false,"configURL":"mbegdt.xml","roomIndex":0,"deviceIndex":0,"rooms":[{"name":"Living Room","index":0,"DTV":"192.168.1.149","IR":true,"devices":[{"name":"Movies","shortname":"MCE","IPAddress":"192.168.1.105","Port":"80","ServicePort":"8092","timeshift":true,"index":0},{"name":"Television","shortname":"DTV","IPAddress":"192.168.1.149","Port":8080,"timeshift":false,"index":1}]},{"name":"Bedroom","index":1,"DTV":"192.168.1.123","IR":true,"devices":[{"name":"Movies","shortname":"MCE","IPAddress":"192.168.1.144","Port":"80","ServicePort":"8092","timeshift":true,"index":0},{"name":"Television","shortname":"DTV","IPAddress":"192.168.1.123","Port":8080,"timeshift":false,"index":1}]},{"name":"Kitchen","index":2,"DTV":"192.168.1.107","IR":true,"devices":[{"name":"Movies","shortname":"MCE","IPAddress":"192.168.1.129","Port":"80","ServicePort":"8092","timeshift":true,"index":0},{"name":"Television","shortname":"DTV","IPAddress":"192.168.1.107","Port":8080,"timeshift":false,"index":1}]}]}
	}
	

	var roomshortname = getItem("roomshortname", "Room 1");
	var shortname = getItem("shortname", "Movies");
	
	if ( settings.rooms.length == 0 ) {
		doAlert("No Servers are defined, Go to settings > gesturePad to define");
		return;
	}

	settings.roomIndex = getItem("roomIndex", 0);
	settings.deviceIndex = getItem("deviceIndex", 0);

	if ( isNumeric( settings.roomIndex ) == false || isNumeric( settings.deviceIndex ) == false) {
		setItem("roomIndex", 0);
		setItem("deviceIndex", 0);
		settings.roomIndex = 0;
		settings.deviceIndex = 0;
	}

	if ( settings.roomIndex > settings.rooms.length ) {
		settings.roomIndex = 0;
		setItem("roomIndex", 0);
	}

	if ( settings.deviceIndex > settings.rooms[ settings.roomIndex ].devices.length ) {
		settings.deviceIndex = 0;
		setItem("deviceIndex", 0);
	} 

	//load channels for DTV, if defined in settings
 	if ( hasDirecTV() ) {
 		loadChannelList();
 	}

	setItem("configURL", "")
	if ( getItem("configURL", "") != settings.configURL ) {
		loadXML();
	}

	updateStatus();
	getRoomStatus();

	setTimeout( function () {
		splash("hide");
	}, 500)
}

function PhoneGapReady() {
    document.addEventListener("resume", onResume, false);
    document.addEventListener("pause", onBackground, false);
	window.onorientationchange = detectOrientation;
    window.onresize = detectOrientation;
    onDeviceReady();

	window.onerror = function(msg, url, line) {
		//doAlert("Error: " + msg + "\nurl: " + url + "\nline #: " + line)
	};
}


function loadXML() {
	var xmlLoc = settings.configURL + "?r=" + Math.random()
	
	$.ajax({
	    type: "GET",
		url: xmlLoc,
		dataType: "xml",
		success: function(resp) {
          	xml = resp;
          	setItem("configURL", settings.configURL) 
		},
		error: function() {
			navigator.splashscreen.hide();
			doAlert("Error loading xml settings: " + xmlLoc );
		}		
	});
}

function loadChannelList() {
	var xmlLoc = "channellist.xml?r=" + Math.random(); //possibly let this be user defined.
	$.ajax({
	    type: "GET",
		url: xmlLoc,
		dataType: "xml",
		success: function(resp) {
          	setupWorker(resp)
		},
		error: function() {
			doAlert("Error loading channel list: "  + xmlLoc);
		}		
	});
}

//bind all events, PG equivelant to doc.ready
function onDeviceReady() {

	splash("show");

	$.gestures.init();
	$.gestures.retGesture(function(gesture) {
		doEvent(gesture);
		clearSleepTimer();
	});
	
	doResize();

	clickEventType = ((document.ontouchstart!==null)?'click':'click'); //never inplemented custom tap

	//event when scrolling ends to refresh dtv channels
	$("#backFace").bind("scroll", function() {
		window.scrollTo(0,0);

		var device = getCurrentDevice();
		if (device != "DTV") {
			return;
		}
		clearTimeout(scrollstop);

		var dtvServers = new Array();
		var currentServer = 0;

		//pull all dtv servers for a round-robin guide pull
		for (var i=0;i<settings.rooms.length;i++) {
			for (var x=0;x<settings.rooms[i].devices.length;x++) {
				if ( settings.rooms[i].devices[x].shortname == "DTV" ) {
					dtvServers[currentServer] = "http://" + settings.rooms[i].devices[x].IPAddress + ":" + settings.rooms[i].devices[x].Port + "/" ;
					currentServer += 1;
				}
			}
		}

		currentServer = 0;

		if (dtvServers.length == 0 ) {
			return;
		}

	    scrollstop = setTimeout(function() {

			var threadcounter = 0;
		    $("#backFace tr").each(function () {
		    	var row = $(this);
		    	if ($(row).attr("data-loaded") != "false") {
		    		return;
		    	}

		        if ( $(row).position().top + $(row).height() > 0 && $(row).position().top < $("#backFace").height()+180 ) {  //is the row scrolled into view   
		        	$(row).find("td:eq(1) div").text( "Loading..." )
	            	if (threadcounter > dtvServers.length-1) {
	            		threadcounter = 0
	            	}
	            	refreshChannel(dtvServers[threadcounter], "DTVImmediate" + threadcounter, $(row).attr("data-key"));
		            threadcounter += 1;					            
		        }
		    });
		    clearSleepTimer()
	    }, 100);
	});

    var hscrollTimer = null;
	$("#boxCoverContainer").bind("scroll", function() {
        clearTimeout(hscrollTimer);
        hscrollTimer = setTimeout(function() { 

        	var device = getCurrentDevice();

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

		        if (visible == true) {
		       		//console.log($(this).find("p:first").text());
		        	$(this).removeClass("pendingImg");
			        var boxImg = $(this).find("img");
			        var guid = $(boxImg).attr("data-guid");
			        var prefix = $(boxImg).attr("data-prefix");
		    		var imgID = "MB_Small_" + guid;
					$(boxImg).onerror = function() {
						$(this).attr("src", "img/nobox.png");
					};
					getImageFromCache({id: imgID, url: prefix + guid + "&maxwidth=120&maxheight=120"}, function(r) {

						var img = new Image();

						img.onerror = function() {
							$(boxImg).attr("src", "img/nobox.png");
						};
						
						if (r.cached == false) { 
							img.onload = function() {
								saveImageToCache( {id: imgID, img: img } );
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



        } , 200 );					
	})

	$("#boxCoverContainer").bind("touchmove touchend", function(e) {
		window.scrollTo(0,0);		
	});

	$("#boxCoverBack").bind(clickEventType, function() {
		if ( $("#covers").data("back") != "" ) {
			if ( $("#covers").data("back") == "ChannelHome" ) { 
				showBottomItems();
			} else {
				var tr = $("<a data-guid='" + $("#covers").data("back") + "' data-type='Folder' data-backwards='1' />");
				showBottomItems(tr)
			}


		}
	})

	$("#bottomGrabber").bind("touchstart",  function(e) {
		var lastY = e.originalEvent.touches[0].screenY;
		$(this).data('lastY', e.originalEvent.touches[0].screenY);
	}); 

	$("#bottomGrabber").bind("touchmove", function(e) {
		e.stopImmediatePropagation();
		e.preventDefault();
		var orig = e.originalEvent.targetTouches[0];  
		var lastY = parseInt($(this).data('lastY'));
		var position = parseInt($("#bottom").css("bottom"));
		var maxHeight = 140;
		var n = 0;
		var bOffset = -140;
		$(this).data('lastY', orig.pageY);

	  	if ( lastY < orig.screenY  ) {
	  		n = position - (orig.pageY - lastY );
	  		if (n <= maxHeight && n >= 0) {
	  			$("#bottom").css("bottom", n + "px");	
	  			$("#browser").css("bottom", (bOffset + n) +"px");
	  		}
		} else {
	  		n = position + (lastY - orig.pageY);
	  		if (n <= maxHeight && n >= 0) {
				$("#bottom").css("bottom", n + "px");
				$("#browser").css("bottom", (bOffset + n) +"px");
			}
		}
	});

	$("#bottomGrabber").bind("touchend",  function(e) {
		setTimeout( function() {
			var maxHeight = 140;
			var position = parseInt($("#bottom").css("bottom"));
			if (position > (maxHeight/3) ) { //more than 1/3 up push to top
			    $("#bottom").animate({
			       bottom: "140px"
			    }, { duration: 200, queue: false });
			    $("#browser").animate({
			       bottom: "-1px"
			    }, { duration: 200, queue: false, complete: function() {
				    if ( ($("#covers").data("back") == "" || $("#covers").data("back") == undefined )  && ( $("#covers").data("loaded") == false || $("#covers").data("loaded") == undefined)  ) {
				    	showBottomItems();
					}
			    }});

			} else {
			    $("#bottom").animate({
			       bottom: "0px"
			    }, { duration: 200, queue: false });
			    $("#browser").animate({
			       bottom: "-140px"
			    }, { duration: 200, queue: false, complete: function() {
			    	if ( ($("#covers").data("back") == "" || $("#covers").data("back") == undefined )   ) {
		    			$("#covers").data("loaded", false);
		    			$("#bottomText span").html("&nbsp;");
		    			$("#covers").html("&nbsp;");

			    	}
			    }});


			}
		}, 100);
	}); 

	$("#card").bind('transitionend webkitTransitionEnd', function() {
	    if (  $("#card").attr("class") == "doFlip" ) {
	    	//showing table list
	    	$("#gestureCallback").empty();
			$("#gestures_canvas").hide();
			showFilter( $("#card").data('flipTo') );
	    }
		if (  $("#card").attr("class") == "" ) {
	    	//showing gesturePad
	    	$("#seekbarContainer").show();
	    	$("#gestures_canvas").show();
	    	$("#backFace").html( "" );	
	    	
	    }
	}); 

	$("#btnTitles").bind(clickEventType, function() {
		window.scrollTo(0,0);
		/* generic flip shit */

		if ( $("#card").attr("class") == "doFlip" ) {
			hideFilter();
			$("#card").toggleClass("doFlip");
			return;
		} 

		$("#seekbarContainer").hide();
		$("#backFace").html( $("#tmpSpinner").html() );
		$("#card").toggleClass("doFlip");	

		var curChannel = $("#NowPlayingTitle").attr("data-item");
		var room  = getCurrentRoom();
		var device = getCurrentDevice();

		if (device.shortname  == "DTV") {
			$("#card").data("flipTo", "DTV");
			//build table for channel list 
			var tb = "<table class='listing'>"
			
			var cat = ""
		 	$.each(guide.channels, function(channelKey, c) { 
		 		if ( cat != c.category ) {
		 			cat = c.category;
		 			tb += "<tr class='head'><td colspan='3'>" + cat + "</td></tr>";
		 		}
				tb += getTableRowHTML(c, channelKey, curChannel);
			});

			tb += "</table>"

			
				   
			$("#backFace").html( tb );
		     
		    checkScrollOverflow()
			
			//scroll to current channel
			var scrollToDiv = 0
			if ( $("#ScrollToMe").size() > 0 ) {
				scrollToDiv = $("#ScrollToMe").position().top - ($("#card").height()/2) + 50 ;
			}
			$("#backFace").scrollTop( scrollToDiv );
			//start scraping data
			$("#backFace").trigger("scroll");
			// trigger channel change on click
			$("#backFace table tr").bind(clickEventType, function () {
		    	if ($(this).is("[data-loaded]")) {
		    	} else {
		    		return;
		    	}
		    	changeChannel( $(this).attr("data-major") );
		   		$("#btnTitles").trigger(clickEventType);
			});

		}

		if (device.shortname  == "MCE") {
			/* populate it */
			$("#card").data("flipTo", "MCE");
			var MBUrl = getMBUrl();


			var parseJsonResults = function (d) {
				var tb =  "<table class='listing' style='width: " + ($("#card").width()-3) + "px !important'>"
				$.each(d.Data.Children, function(key, val) { 
					tb += '<tr data-guid="' + d.Data.Children[key].Id + '" data-type="' + d.Data.Children[key].Type + '"  data-imdb="' + ((d.Data.Children[key].ImdbRating > 0) ? "1" : "0")  + '" >';
					tb += '<td><div>' + d.Data.Children[key].Name  + '</div></td>';
					tb += '<td width="30px" style="text-align: right">' + d.Data.Children[key].ChildCount  + '</td></tr>';	
				});
				 tb += "</table>";
			     $("#backFace").html( tb );
			     checkScrollOverflow();
				
				$("#backFace table tr").bind(clickEventType, function () {
						ShowItems( $(this) );
				});
			}

			var getJsonFromServer = function(MBUrl, parse) {

		        if ( isWifi() == false ) {
		        	if (parse) {
		        		doAlert("You are not on Wifi and no cached version exists. To do this, connect to Wifi and try again");
			            $("#btnTitles").trigger(clickEventType);
			            return;
		        	}
		        }

				$.ajax({
					url: MBUrl,
					dataType: 'json',
					timeout: settings.MBServiceTimeout,
					success: function(d) {
						saveJsonToCache(MBUrl, d);
						if (parse) {
							parseJsonResults(d);	
						}
					}, 
					error: function() {
						if (parse) {
							doAlert("The server is not responding in time, and no cached version exists. Try again later")
						}
					}
				});
			}

			MBUrl += "library/";

			getJsonFromCache(MBUrl, function(d) {
				if (d == null) {
					getJsonFromServer(MBUrl, true);
				} else {
					parseJsonResults(d); //display cached
					getJsonFromServer(MBUrl, false); //get from server, to replace cache but dont parse
				}
			});
	
		}
	});
	
	$("#btnCommands").bind(clickEventType, function() {
		/* generic flip shit */
		if ( $("#card").attr("class") == "doFlip" ) {
			hideFilter();
			$("#card").toggleClass("doFlip");
			return;
		} 
		$("#seekbarContainer").hide();
		$("#card").data("flipTo", "gesturelist");
		$("#backFace").html( $("#tmpSpinner").html() );
		$("#card").toggleClass("doFlip");		

		/* populate it */
		var category = "";
		var tb = "<table class='listing'>"

		var room  = getCurrentRoom();
		var device = getCurrentDevice();

		//write globals
		var globals = $(xml).find('gesturePad > rooms > room[index="' + room.index + '"] ~ roomgestures > gesture > device')
		if ( $(globals).size() > 0 ) {
			tb += "<tr class='head'><td colspan='2'>Global Commands</td></tr>" ;
			var currentItems = new Array();
			$(globals).each( function(i) {
				var devicenode = $(this);
				var devicename = $(this).children("name:first").text();
				var roomname = room.name;
				
				$(devicenode).find("command").each(function() {
					var commandname = $(this).children("name:first").text();
					var gestureDefinition = "";

					gestureDefinition = $(devicenode).parent().attr("definition");
				 	if (gestureDefinition == "nothing") {
				 		gestureDefinition = "";
				 	}
				 	if ( jQuery.inArray(commandname, currentItems) == -1 ) {
						tb += '<tr> '
									+ '<td>' + ((gestureDefinition == "")?"":"👆 ") + "<span class='sSpan'>" + commandname + "</span>"
									+ '</td><td style="width: 50px !important"><div style="width: 50px !important; overflow:hidden">' + gestureDefinition + '</div></td></tr>';
						currentItems.push(commandname);
				 	}


				});
			})
		}

		//write device specific
		$(xml).find('gesturePad > devices > device[shortname="' + device.shortname + '"]').each( function() {
			var devicenode = $(this);
			var devicename = $(this).children("name:first").text();
			var roomname = room.name;
			
			$(devicenode).find("command").each(function(i){
				var actions = $(this).find("action");
				var gestureDefinition = "";
				var commandname = $(this).children("name:first").text();
			
				$(this).find("gesture").each(function(i){ 
					if (i==0) {
						gestureDefinition = ""
						gestureDefinition = $(this).attr("definition");
					} 
				});
				
			 	if (category != ( $(this).parent().children("name:first").text() ) ) {
			 		category = $(this).parent().children("name:first").text();
			 		tb += "<tr class='head'><td colspan='2'>" + category + '</td></tr>' ;
			 	}
			 	
				tb += '<tr> '
							+ '<td>' + ((gestureDefinition == "")?"":"👆 ") + "<span class='sSpan'>" + commandname + "</span>"
							+ '</td><td style="width: 50px !important"><div style="width: 50px !important; overflow:hidden">' + gestureDefinition + '</div></td></tr>';
			});
		});
		tb += "</table>"
	
		$("#backFace").html( tb );
		checkScrollOverflow()

		$("#backFace table tr").bind(clickEventType, function () {
			executeGestureByCommandName( $(this).find("span").text() )
		})
	});

	$("#VolumeSliderSeek").bind("touchmove", function(event) {  
			event.preventDefault();
			clearTimeout(slideTimer);
			clearSleepTimer()
			//event.preventDefault();
			var e = event.originalEvent;
		    var touch = e.touches[0]; 

		    var max = $("#VolumeSlider").width();
		    var x = touch.pageX - 50;
		    if (x > max) {
		    	x = max;
		    }
		    
		    var percentageDragged =  x/max ;
		    var left = (x-10);
		    if (left < 0) {
		    	left = 0;
		    }
		    $("#VolumeSliderSeek").attr("style", "left: " + left + "px");
		    $("#VolumeSliderh").attr("style", "width: " + Math.floor(percentageDragged*100) + "%");
			
		    var MaxVolumeJump = 20;
	    	var seekTo = Math.round( MaxVolumeJump - (MaxVolumeJump * percentageDragged) );
		    var sendval = 0;
		    if ( seekTo >= (MaxVolumeJump/2) ) {
		    	//down
		    	sendval = (seekTo-(MaxVolumeJump/2));
		    	if (sendval > 0 ) {
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
				sendval = ((MaxVolumeJump/2)-seekTo );
				if (sendval > 0 ) {
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
		if ( $("#VolumeContainer").attr("data-sendval") != "0" ) {
			doSlideEvent();
		}
	})

	$("#seekbarContainer").bind("touchmove", function(event) {  
			clearSleepTimer()
			clearTimeout(slideTimer);
			if ( getCurrentDevice().shortname == "MCE" ) {
				event.preventDefault();
				var e = event.originalEvent;
			    var touch = e.touches[0]; 

			    var max = $("#slider").width();
			    var x = touch.pageX - 50;
			    if (x > max) {
			    	x = max;
			    }

			    var duration = $("#timespanright").attr("data-duration");

			    if (isNumeric(duration)) {

				    var percentageDragged =  x/max ;
				    $("#timeseek").attr("style", "left: " + (x-10) + "px");
				    $("#timebar").attr("style", "width: " + Math.floor(percentageDragged*100) + "%");
					
			    	var seekTo = Math.floor(  duration * percentageDragged );

				    $(this).attr("data-sendval", seekTo);
				     
				    //slideTimer = setTimeout(doSeekEvent, 500);
			    }
			    

			}
	});

	$("#seekbarContainer").bind("touchend", function(event) {  
		doSeekEvent()
	})

	$("#btnRoom").bind(clickEventType, function() {

		var oncomplete = function(buttonIndex) {
				settings.roomIndex = buttonIndex;
				settings.deviceIndex = 0;
				updateStatus();
				getRoomStatus();
		}

		if ( isPhoneGap() ) {
			var actionSheet = window.plugins.actionSheet;
			var RoomNames = new Array();

			var rooms = settings.rooms;
			for (var i=0;i<rooms.length;i++) {
				RoomNames.push( rooms[i].name )
			}

			RoomNames.push( "Cancel" );

			actionSheet.create({title: 'Change Room', items: RoomNames, destructiveButtonIndex: (RoomNames.length-1)}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1  || buttonIndex == (RoomNames.length-1)) {
					return;
				} else {
					oncomplete(buttonIndex);
				}
				
			});
		} else {
			var answer = prompt ("Enter a room index?","0");
			if ( isNumeric(answer) ) {
				if ( parseInt(answer) < settings.rooms.length ) {
					oncomplete( parseInt(answer) )
				}
			}
		}
	});

	$("#btnTransfer").bind(clickEventType, function() {

		var oncomplete = function(buttonIndex) {
			var room = getCurrentRoom();
			settings.deviceIndex = buttonIndex;
			var device = getCurrentDevice();
			var deviceShortName = device.shortname;

			if ( room.IR ) {
				setDeviceByShortName("MCE"); //force device back to MCE, because EG swithces the inputs
				var switchInputNode = $(xml).find('gesturePad > devices > device[shortname="MCE"] > commands > category > command > action > onCompleteSetDevice[shortname="' + deviceShortName + '"]:first');
				if ( $(switchInputNode).size() > 0 ) {
					doEvent("manual",  $(switchInputNode).parent() );	
					getRoomStatus();		 			
				}
			}
			updateStatus();
		}

		if ( isPhoneGap() ) {
			var actionSheet = window.plugins.actionSheet;
			var RoomDevices = new Array();

			var devices = getCurrentRoom().devices;
			for (var i=0;i<devices.length;i++) {
				RoomDevices.push( devices[i].name )
			}
			RoomDevices.push( "Cancel" );
			actionSheet.create({title: 'Switch Input', items: RoomDevices, destructiveButtonIndex: (RoomDevices.length-1)}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1  || buttonIndex == (RoomDevices.length-1)) {
					return;
				} else {
					oncomplete(buttonIndex);
				}
			});
		} else {
			var answer = prompt ("Enter a device index?","0");
			if ( isNumeric(answer) ) {
				var room = getCurrentRoom();
				var devices = room.devices;
				if ( parseInt(answer) < devices.length ) {
					oncomplete( parseInt(answer) )
				}
			}

		}
	})

	$("#btnPower").bind(clickEventType, function() {
		executeGestureByCommandName("Power");
	});
	$("#btnPlay").bind(clickEventType, function() {
		if ( $(this).hasClass("playing") ) {
			executeGestureByCommandName("Pause");
			$(this).removeClass("playing");
		} else {
			executeGestureByCommandName("Play");
		}
		
	});
	$("#btnMute").bind(clickEventType, function() {
		executeGestureByCommandName("Mute");
	});
	

	$("#header").bind(clickEventType, function() {
		//scrolltop
		if ( $("#backFace table").size() > 0 ) {
			$("#backFace").scrollTop(0);
		}
	});

	$("#searchform").bind("submit", function(event) {
		event.preventDefault();

    	var s = $("#Filter input.searcher").val().toLowerCase();
    	$("#backFace tr").each(function() {
    		var t = $(this).text().toLowerCase();
    		if ( $(this).hasAttr("data-fullname") ) {
    			t += " " + $(this).attr("data-fullname").toLowerCase();
    		} 
    		if ( t.indexOf(s) == -1 ) {
    			$(this).hide()
    		} else {
    			$(this).show()
    		}
    	})
		$("#backFace").trigger("scroll");
		checkScrollOverflow();
		return true;
	});

	$("#top, #toptrans, #overallVolumeContainer").bind("touchmove", function(event) {
		event.preventDefault();
	})

	loadSettings();

 	npTimer = setInterval(function() {
      nowPlaying()
      getRoomStatus()
	}, 30000);

	clearSleepTimer();

	window.scrollTo(0,0);

}

function setupWorker(channellist) {

	if ( hasDirecTV() == false ) { 
		return;
	}
	guide.channels = new Array();

	//setup base structures
	var dedupe = ""
	$(channellist).find('channels > channel').each(function() {
		if (dedupe != $(this).find("number").text() ) {
	  		var channel = new Object();
		  	channel.number = $(this).find("number").text() ;
		  	channel.logo = $(this).find("logo").text();
		  	channel.callsign = $(this).find("callsign").text();
		  	channel.nowplaying = "";
		  	channel.ending = 0;
		  	channel.timeleft = "";
		  	channel.fullname = $(this).find("fullname").text();
		  	channel.startTime = 0;
		  	channel.duration = 0;

		  	var fav = $(channellist).find('channels > favorites > category > number').filter(function() { return $(this).text() == channel.number  });;

		  	if ( $(fav).size() > 0 ) {
		  		channel.category = $(fav).parent().attr("name");
		  		channel.catIndex = parseInt($(fav).parent().attr("idx"));
		  	}  else {
		  		channel.category = "Unsorted";
		  		channel.catIndex = 999;
		  	}

			guide.channels.push( channel );
			dedupe = channel.number;
		}
	});

	guide.channels.sort(compare);

	startWorker();
}

//sort em
function compare(a,b) {
  if (a.catIndex < b.catIndex)
     return -1;
  if (a.catIndex > b.catIndex)
    return 1;
  return 0;
}

function startWorker() {
	try {
		clearTimeout(workerTimer)
	} catch (e) {}

	if ( isPhoneGap() ) {
		 
		//save all dtv servers to an array
		var dtvServers = new Array();
		var currentServer = 0;

		//pull all dtv servers for a round-robin guide pull
		for (var i=0;i<settings.rooms.length;i++) {
			for (var x=0;x<settings.rooms[i].devices.length;x++) {
				if ( settings.rooms[i].devices[x].shortname == "DTV" ) {
					dtvServers[currentServer] = "http://" + settings.rooms[i].devices[x].IPAddress + ":" + settings.rooms[i].devices[x].Port + "/" ;
					currentServer += 1;
				}
			}
		}


		currentServer = 0;
	 	$.each(guide.channels, function(channelKey) { 
	 		var c = guide.channels[channelKey];

	 		//first determine if the channel needs a refresh
	 		if (c.nowplaying == "" || (c.ending) > (new Date).getTime() ) {
	 			c.nowplaying = "";

	 			var blnFoundServer = false;
	 			while(blnFoundServer == false) {
	 				//pick a server
			 		if ( currentServer > dtvServers.length-1 ) {
			 			currentServer = 0
			 		}
		 			//queue the refresh on that server
		 			if ( dtvServers[currentServer].room != getCurrentDevice().shortname ) { //dont overload the current room
		 				refreshChannel(dtvServers[currentServer], "DTVWorker"+currentServer, channelKey);
		 				blnFoundServer = true;
		 			}

		 			currentServer += 1;
	 			}

	 		}


		});

	 	workerTimer = setTimeout( "startWorker()", 300000 );
	} else {
		return;
	}
}

function refreshChannel(server, queueName, channelKey) {
	
    if ( isWifi() == false ) {
        return;
    }

	var c = guide.channels[channelKey];
	$.ajaxq(queueName, {
		url: server + 'tv/getProgInfo',
		dataType: "json",
		type: "GET",
		timeout: 10000,
		data: 'major=' + c.number,
		success: function(response) {
			c.nowplaying = response.title;
			c.startTime = response.startTime;
			c.duration = response.duration;
			c.timeleft = hms2( (response.startTime+response.duration) - Math.floor(new Date().getTime() / 1000)  );
			c.ending = (response.startTime+response.duration);

			if ( $("#tr"+channelKey).size() > 0 ) {
				var row = $("#tr"+channelKey);
				//update on screen info
				$(row).find("td:eq(1) div").text( c.nowplaying )
            	$(row).find("td:eq(2)").text( c.timeleft ) 
            	$(row).attr("data-loaded", "true")

			}
		},
		error: function(x,y,z) {
			console.log("Refresh Channel Error: " + server);
		}
	});
}

function clearSleepTimer() {
	SleepDevice(false);
 	clearTimeout(sleepTimer);
 	return;
 	if (settings.SleepThreshold > 0) {
		sleepTimer = setTimeout( "SleepDevice(true)", settings.SleepThreshold );
 	}
}

function SleepDevice(sleep) {
	return;
	if (settings.SleepThreshold > 0) {
		if (sleep) {
			if ( $("#gestures_canvas:visible").size() == 0  ) {
				return;
			} 
			executeObjC("http://gesturepad/sleep/?do=true")
		} else {
			executeObjC("http://gesturepad/wake/?do=true")
		}
	}
}

function executeObjC(url) {
  return;
  var iframe = document.createElement("IFRAME");
  iframe.setAttribute("src", url);
  document.documentElement.appendChild(iframe);
  iframe.parentNode.removeChild(iframe);
  iframe = null;
}

function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

function splash(t) {
	try {
		if ( t == "hide" ) {
			navigator.splashscreen.hide();
		} else {
			navigator.splashscreen.show();
		}
	} catch (e) {}
}

/*
	//get xml from json
    $.getJSON('guideChannelList.json', function(data) {
    	var out = "<channels>"
        $.each(data.channels, function(i) {
        	out += "<channel>"
        	out += "<number>" + data.channels[i].chNum + "</number>"
        	out += "<callsign><![CDATA[" + data.channels[i].chCall + "]]></callsign>"
        	if (data.channels[i].chLogoUrl == null) {
        		out += "<logo></logo>"
        	} else {
        		out += "<logo><![CDATA[img/channels" + data.channels[i].chLogoUrl.substring( data.channels[i].chLogoUrl.lastIndexOf("/") ) + "]]></logo>"
        	}
        	out += "<fullname><![CDATA[" + data.channels[i].chName + "]]></fullname>"
            out += "</channel>"
        });
        out += "</channels>"
        document.write(htmlEscape(out))
    });
    return;

    //get list of images
      $.getJSON('guideChannelList.json', function(data) {
    	var out = ""
        $.each(data.channels, function(i) {
        	if (data.channels[i].chLogoUrl == null) {
        	} else {
        		out += "<a href='http://directv.images.cust.footprint.net/" + data.channels[i].chLogoUrl + "'>" + data.channels[i].chLogoUrl.substring( data.channels[i].chLogoUrl.lastIndexOf("/") ) + "</a>"
        	}
        });
        $("body").html(out)
    });
    return;
*/


function DoShuffle() {
		//i dunno if this will come back, twas cool
		if (localStorage.getItem("shortname") != "MCE") {
			return;
		}
		var actionSheet = window.plugins.actionSheet;
		var actions = ["Will Ferrell", "Comedy", "Action", "Romance", "Horror", "Funny TV"];
		var actionTypes = ["Actor", "Genre", "Genre", "Genre", "Genre", "TV"];
		actions.push("Cancel")

		actionSheet.create({title: 'Shuffle Surprise!', items: actions, destructiveButtonIndex: (actions.length-1)}, function(buttonValue, buttonIndex) {
			if (buttonIndex == -1  || buttonIndex == (actions.length-1)) {
				return;
			}
			$.getJSON('http://rss.jed.bz/?t=' + actionTypes[buttonIndex] + '&v=' + actions[buttonIndex] + '', function(data) {

				navigator.notification.confirm(
				   data.Name, 
					function(buttonIndex) {
            			playByID(buttonIndex, data.Id);
        			},
				   'Play Title?', 
				   'Play It, Cancel'
				);
			});
		});
}

function playByID(buttonIndex, id)  {
	if (buttonIndex == 2) {
		DoShuffle()
	}
	if (buttonIndex == 1) {
	
		var MBUrl = getMBUrl();

		MBUrl += "ui?command=play&id=" + id
		$.getJSON(MBUrl, function(x) {
			setTimeout(function() {
				nowPlaying();
			}, 1500)
         })
	}
}

function playTitle(tr, movieTitle) {

    if ( isWifi() == false ) {
        doAlert("You are not on Wifi. To play this title, connect to Wifi and try again");
        return;
    }

	var actionSheet = window.plugins.actionSheet;
	var actions = ["Play", "Resume", "View on Screen"];

	if ( $(tr).attr("data-imdb") == "1" ) {
		actions.push("View Imdb Page")	
	}

	actions.push("Cancel");

	var MBUrl = getMBUrl();
	var guid = $(tr).attr("data-guid")
	var title = "Actions";

	if ( title != undefined ) {
		title = movieTitle;
	}

	actionSheet.create({title: title, items: actions, destructiveButtonIndex: (actions.length-1)}, function(buttonValue, buttonIndex) {
		if (buttonIndex == -1  || buttonIndex == (actions.length-1)) {
			return;
		}
		switch(actions[buttonIndex]) {
			case "Play":
				MBUrl += "ui?command=play&id=" + guid
				break;
			case "Resume":
				MBUrl += "ui?command=resume&id=" + guid
				break;
			case "View on Screen":
				MBUrl += "ui?command=navigatetoitem&id=" + guid
				break;
			case "View Imdb Page":
				MBUrl = ""
				break;
		}
		if ( MBUrl != "" ) {
			$.getJSON(MBUrl, function() {
				setTimeout(function() {
					nowPlaying();
				}, 1500)
		     })
		} else {
			//launch Imdb
			$.ajax({
				url: getMBUrl() + "library/?Id=" + guid + "&lightData=1",
				dataType: 'json',
				timeout: settings.MBServiceTimeout,
				success: function(x) {
					if ( x.Data.ImdbID ) {
				    	cb = window.plugins.childBrowser;    
					    if (cb != null) {
					        cb.showWebPage("http://m.imdb.com/title/" + x.Data.ImdbID);
					    }	
					} else {
						doAlert("Sorry, This title does not have an IMBD id");
					}
				}, 
				error: function() {
					if (parse) {
						doAlert("The server is not responding in time, and no cached version exists. Try again later");
					}
				}
			});
		}
	});	
}

function showBottomItems(tr) {

	var device = getCurrentDevice();

	if (device.shortname == "MCE") {

		var MBUrl = getMBUrl();
		
		var boxCoverWidth = 70;
		var backwards = false;
		if ( tr ) {
			if ( $(tr).attr("data-type") == "Movie" || $(tr).attr("data-type") ==  "Episode"  ) {
				playTitle( $(tr), $(tr).parent().find("p").text() );
				return;
			}
			if ( $(tr).hasAttr("data-backwards") ) {
				backwards = true;
			}
		}
		
		var animationProps = {"startCoverOpacity": 0.25, "startCoverTop": "140px", "endCoverOpacity": 1, "endCoverTop": "24px"};

		if (backwards) {
			animationProps = {"startCoverOpacity": 0.25, "startCoverTop": "-164px", "endCoverOpacity": 1, "endCoverTop": "24px"};
		}

		$('#covers').animate({
			"opacity": animationProps.startCoverOpacity,
			"margin-top": animationProps.startCoverTop
			}, 250, function() {
				$("#covers").css("margin-top", "24px").width( $(window).width() );
				$("#covers").html("<div class='boxLoader'><p class='boxLoading'>Loading Data...</p></div>").css("opacity", "1").hide().fadeIn();

				var parseJsonResults = function (x) {
					var tb = '<div style="width: 40px; height: 100%; float:left"> </div>';

					$("#covers").width( ((x.Data.Children.length) * boxCoverWidth) + 50 );

					if (settings.moviesByDate && x.Data.Type == "Folder"  ) {
						x.Data.Children.sort(function(a,b) { return Date.parse(b.DateCreated) - Date.parse(a.DateCreated) } );
					}

					if (settings.tvByDate && ( x.Data.Type == "Season" || x.Data.Type == "Series") ) {
						x.Data.Children.sort(function(a,b) { return Date.parse(b.DateCreated) - Date.parse(a.DateCreated) } );
					}
					
					$.each(x.Data.Children, function(key, val) { 
						tb += '<div class="smallboxContainer pendingImg" >' 
						if (x.Data.Children[key].IsFolder == true) {
							if ( x.Data.Children[key].RecentlyAddedUnplayedItemCount > 0 ) {
								tb += '<div class="badge" >' + x.Data.Children[key].RecentlyAddedUnplayedItemCount + '</div>' 		
							}
						}
						
						tb += '<img data-prefix="' + getMBUrl() + 'image/?Id=' + '" data-guid="' + x.Data.Children[key].Id + '" data-type="'+ x.Data.Children[key].Type + '" class="smallBox" src="img/nobox.png"  data-imdb="' + ((x.Data.Children[key].ImdbRating > 0) ? "1" : "0")  + '" />';
						tb += '<p>' + x.Data.Children[key].Name  + '</p>'
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
						getImageFromCache({id: imgID, url: prefix + guid + "&maxwidth=120&maxheight=120"}, function(r) {
							var img = new Image();
							img.onerror = function() {
								$(boxImg).attr("src", "img/nobox.png");
							};
							if (r.cached) { 
								$(boxImg).attr("src", r.url);
								$(this).removeClass("pendingImg");
							}
						});
					})

					$('#covers').css("margin-top", "-130px").css("opacity", "0.25");

					$("#covers").empty().append( $(children).children() ) ;
					$("#covers img").bind(clickEventType, function () {
						$("#boxCoverBack").data("scrollPosition", $("#boxCoverContainer").scrollLeft() );
						showBottomItems( $(this) )
					});

					$('#covers').animate({
						"opacity": animationProps.endCoverOpacity,
						"margin-top": animationProps.endCoverTop
						}, 250, function() {
							if ( $("#boxCoverBack").data("scrollPosition") && backwards ) {
								$("#boxCoverContainer").animate({scrollLeft:  parseInt( $("#boxCoverBack").data("scrollPosition") )  }, 500);
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
				}

				var getJsonFromServer = function(url, parse) {

			        if ( isWifi() == false && parse) {
			            doAlert("Sorry, you are not on Wifi, and this data is yet to be cached.")
			            $("#covers").html("<div class='boxLoader'><p class='boxLoading'>No data found.</p></div>")
			            return;
			        }

					$.ajax({
						url: url,
						dataType: 'json',
						timeout: settings.MBServiceTimeout,
						success: function(d) {
							saveJsonToCache(url, d);
							if (parse) {
								parseJsonResults(d);	
							}
						}, 
						error: function() {
							if (parse) {
								doAlert("The server is not responding in time, and no cached version exists. Try again later")
								$("#covers").html("<div class='boxLoader'><p class='boxLoading'>No data found.</p></div>")
							}
						}
					});
				}

				if ( tr ) {
					MBUrl += "library/?lightData=1&Id=" + $(tr).attr("data-guid");
				} else {
					MBUrl += "library/";
				}
				
				getJsonFromCache(MBUrl, function(d) {
					if (d == null) {
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

		var boxCoverWidth = 70;
		var backwards = false;
		if ( tr ) {
			if ( $(tr).attr("data-type") == "Movie" || $(tr).attr("data-type") ==  "Episode"  ) {
				playTitle( $(tr), $(tr).parent().find("p").text() );
				return;
			}
			if ( $(tr).hasAttr("data-backwards") ) {
				backwards = true;
			}
		}
		
		var animationProps = {"startCoverOpacity": 0.25, "startCoverTop": "140px", "endCoverOpacity": 1, "endCoverTop": "24px"};

		if (backwards) {
			animationProps = {"startCoverOpacity": 0.25, "startCoverTop": "-164px", "endCoverOpacity": 1, "endCoverTop": "24px"};
		}

		$('#covers').animate({
			"opacity": animationProps.startCoverOpacity,
			"margin-top": animationProps.startCoverTop
			}, 250, function() {
				$("#covers").css("margin-top", "24px").width( $(window).width() );
				$("#covers").html("<div class='boxLoader'><p class='boxLoading'>Loading Data...</p></div>").css("opacity", "1").hide().fadeIn();

				var tb = '<div style="width: 40px; height: 100%; float:left"> </div>';
				if ( tr ) {
					//load a group
					var category = $(tr).attr("data-category");
					var i = 0;
					$.each(guide.channels, function(channelKey, c) { 
						if (c.category == category) {
							tb += '<div class="smallboxContainer" >' 
							tb += '<div class="channelContainer"><div data-minor="' + c.number + '" class="smallChannel" style="background-image: url(' + c.logo + ')" ></div></div>';
							tb += '<p>' + c.fullname + '</p>'
							tb += '</div>';
							i++
						}
					});
					$("#covers").width( (( i ) * boxCoverWidth) + 50 );

				} else {
					//get channel categories
					var categories = [];

					$.each(guide.channels, function(channelKey, c) { 

						var chanObject = {category: c.category, logo: c.logo, name: c.fullname };
						var blnFound = false;
						$.each(categories, function(x, y) {
							if ( y.category == c.category ) {
								blnFound = true;
								return false;
							}
						});

						if (blnFound == false) {
							categories.push(chanObject);
						}
					});

					$.each(categories, function(x, y) {
						tb += '<div class="smallboxContainer" >' 
						tb += '<div class="channelContainer"><div data-category="' + y.category + '" class="smallChannel" style="background-image: url(' + y.logo + ')" ></div></div>';
						tb += '<p>' + y.category + '</p>'
						tb += '</div>';
					})

					$("#covers").width( (( categories.length ) * boxCoverWidth) + 50 );
				}

				var children = $("<div>" + tb + "</div>");

				$('#covers').css("margin-top", "-130px").css("opacity", "0.25");

				$("#covers").empty().append( $(children).children() ) ;
				$("#covers div.smallChannel").bind(clickEventType, function () {
					if ( $(this).hasAttr("data-category") ) {
						$("#boxCoverBack").data("scrollPosition", $("#boxCoverContainer").scrollLeft() );
						showBottomItems( $(this) )
					} else {
						//change to the channel
						changeChannel( $(this).attr("data-minor") );
					}

				});

				$('#covers').animate({
					"opacity": animationProps.endCoverOpacity,
					"margin-top": animationProps.endCoverTop
					}, 250, function() {
						if ( $("#boxCoverBack").data("scrollPosition") && backwards ) {
							$("#boxCoverContainer").animate({scrollLeft:  parseInt( $("#boxCoverBack").data("scrollPosition") )  }, 500);
						}
						var folderName = "Categories";
						if (tr) {
							$("#covers").data("back", "ChannelHome");
							folderName = $(tr).attr("data-category")
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
}


function ShowItems(tr) {
	clearSleepTimer()

	var MBUrl = getMBUrl();

	if ( $(tr).attr("data-type") == "Movie" || $(tr).attr("data-type") ==  "Episode"  ) {
		//play title
		playTitle( $(tr), $(tr).find("td:first").text() );
		return;
	}

	if ( $(tr).attr("data-type") == "Shuffle" ) {
		//play title
        if ( isWifi() == false ) {

            doAlert("You are not on Wifi. To play this title, connect to Wifi and try again");
            return;
        }
		MBUrl += "ui?command=shuffle&id=" + $(tr).attr("data-guid")
		$.getJSON(MBUrl, function(x) {
			$("#btnTitles").trigger(clickEventType);
			setTimeout(function() {
				nowPlaying();
			}, 1500)
         })
		return;
	}


	var parseJsonResults = function (x) {
		$("#backFace table").html( "" );
		tb = "";

		if ( x.Data.Name != "StartupFolder" ) {
			tb += '<tr data-guid="' + x.Data.parentId + '" data-type="Folder">'
				+ '<td colspan="2"><div>.. </div></td>';

			tb += '<tr data-guid="' + x.Data.Id + '" data-type="Shuffle">'
				+ '<td colspan="2" class="shuffle"><div> Shuffle </div></td>';
		}

		if (settings.moviesByDate && x.Data.Type == "Folder"  ) {
			x.Data.Children.sort(function(a,b) { return Date.parse(b.DateCreated) - Date.parse(a.DateCreated) } );
		}

		if (settings.tvByDate && ( x.Data.Type == "Season" || x.Data.Type == "Series") ) {
			x.Data.Children.sort(function(a,b) { return Date.parse(b.DateCreated) - Date.parse(a.DateCreated) } );
		}
		
		$.each(x.Data.Children, function(key, val) { 
			tb += '<tr data-guid="' + x.Data.Children[key].Id + '" data-type="'+ x.Data.Children[key].Type +'" data-imdb="' + ((x.Data.Children[key].ImdbRating > 0) ? "1" : "0")  + '" >'
				+ '<td><div>' + ( (x.Data.Children[key].WatchedPercentage < 5) ? "&#10022; " : ""  ) 
				+ x.Data.Children[key].Name 
				+ ( (x.Data.Children[key].ProductionYear) ? " (" + x.Data.Children[key].ProductionYear + ")" : ""  ) 
				+ '</div></td>';

			if ( x.Data.Children[key].Type == "Folder") {
				tb += '<td width="30px" style="text-align: right">' + x.Data.Children[key].ChildCount  + '</td></tr>';
			} else {
				tb += '<td width="30px" style="text-align: right">'
				if ( x.Data.Children[key].ImdbRating  ) {
					tb += x.Data.Children[key].ImdbRating 
				}	
				tb += '&nbsp;</td></tr>'
			}

		});
		$("#backFace table").html( tb );
		checkScrollOverflow();
		$("#backFace table tr").bind(clickEventType, function () {
			ShowItems( $(this) )
		})
	}

	var getJsonFromServer = function(MBUrl, parse) {
        if ( isWifi() == false && parse ) {
            doAlert("Sorry, you are not on Wifi, and this data is yet to be cached.");
            return;
        }

		$.ajax({
			url: MBUrl,
			dataType: 'json',
			timeout: settings.MBServiceTimeout,
			success: function(d) {
				saveJsonToCache(MBUrl, d);
				if (parse) {
					parseJsonResults(d);	
				}
			}, 
			error: function() {
				if (parse) {
					doAlert("The server is not responding in time, and no cached version exists. Try again later")
				}
			}
		});
	}

	MBUrl += "library/?lightData=1&Id=" + $(tr).attr("data-guid");
	console.log(MBUrl)
	getJsonFromCache(MBUrl, function(d) {
		if (d == null) {
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

function doSeekEvent() {
	var device = getCurrentDevice();
	if (device.shortname != "MCE") {
		return;
	}
	var seek = $("#seekbarContainer").attr("data-sendval");
	var base = getMBUrl() + "ui?command=seek&value=" + seek + "&controllerName=" + $("#timespanright").attr("data-controller") ;
	$.getJSON(base, function() {
		setTimeout(function() {
			nowPlaying();
		}, 1500)
	 })
}

function doSlideEvent() {
	appendOncetoQueryString = "&" + $("#VolumeContainer").attr("data-sendval");
	executeGestureByCommandName($("#VolumeContainer").attr("data-command"));
	resetVolumeSlider();
}

function getTableRowHTML(c, channelKey, curChannel) {
	var row = "";
	var timeleft = hms2( (c.startTime+c.duration) - Math.floor(new Date().getTime() / 1000)  );
	
	if (c.nowplaying == "" || timeleft == "0:00" || timeleft == "00:00" ) { //needs refresh
		row += '<tr id="tr' + channelKey + '" data-loaded="false" data-major="' + c.number + '" data-key="' + channelKey + '" data-fullname="' + escape(c.fullname) + '"><td width="50px" ' 
		if ( c.logo != "" ) {
			row += "style = 'background: url(" + c.logo + ") center no-repeat' > "  
		} else {
			row += 'style="text-align: center" >' + c.number
		}
		row += '</td>' +
		'<td><div ' + ((curChannel == c.callsign + c.number ) ? " id='ScrollToMe' " : "" ) + '>' +
		'</div></td>'+
		'<td width="30px" style="text-align: right">0:00';

	} else { //pull cached
		//$("#txtRoom").text(c.number + " " + c.startTime+ " " + c.duration + " " + Math.floor(new Date().getTime() / 1000) );

		row += '<tr id="tr' + channelKey + '" data-loaded="true" data-major="' + c.number + '" data-key="' + channelKey + '" data-fullname="' + escape(c.fullname) + '"><td width="50px" ' 
		if ( c.logo != "" ) {
			row += "style = 'background: url(" + c.logo + ") center no-repeat' > " 
		} else {
			row += 'style="text-align: center" >' + c.number
		}
		row += '</td>' +
		'<td><div ' + ((curChannel == c.callsign + c.number ) ? " id='ScrollToMe' " : "" ) + '>' +
		c.nowplaying +
		'</div></td>'+
		'<td width="30px" style="text-align: right">' + timeleft +''; 
	}
	row += "</td></tr>";
	return row;
}

function checkScrollOverflow() {
	if ( $("#backFace table").height() > $("#backFace").height() ) {
		$("#backFace").attr("style", "overflow-x: hidden; -webkit-overflow-scrolling : touch");
		$("#backFace").unbind("touchmove");
	} else {
		$("#backFace").bind("touchmove", function(event) {
			event.preventDefault();
		})
	}
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function showFilter(to) {
		$("#Filter div.emoji").hide()
		if (to == "DTV") {
			 $("#Filter div.dtv").show()
		}
		if (to == "MCE") {
			 $("#Filter div.mce").show()
		}

		$("#Filter input").val("");
		$("#Filter").fadeIn();
}

function hideFilter() {
	//setTimeout(function () {
		$("#Filter").fadeOut();
	//}, 1000)
}


function onResume() {
	clearNowPlaying()
	getRoomStatus()
	SleepDevice(false);

 	npTimer = setInterval(function() {
      nowPlaying()
	}, 30000);
}

function onBackground() {
	SleepDevice(false);
	clearInterval(npTimer);
}

function detectOrientation(){
    if(typeof window.onorientationchange != 'undefined'){
        doResize();
    }
}

function doResize() {
 	$("#card").height( $("body").height() - ($("#top").outerHeight() + ( $("#bottom").outerHeight() / 3.5) ) )
	var h = $("#container").height() - ($("#top").outerHeight() + $("#bottom").outerHeight() + $("div.toptrans").outerHeight() -1) ;
	var w = $("body").width();
	$("#gestures_canvas").attr("height", h)
	$("#gestures_canvas").attr("width", w)
	$("#gestures_canvas").height(h)
	$("#gestures_canvas").width(w)


	resetVolumeSlider();
	resetNPSeek();

	setTimeout(function() {
		setSwipeThresholds();
	}, 1500)
}

function resetNPSeek() {
	$("#timeseek").attr("style", "left: " + ( $("#timebar").width() -10) + "px");
}

function resetVolumeSlider() {
	//set volume slider at center
    var max = $("#VolumeSlider").width();
    var x = max*0.5;
    $("#hud").fadeOut();
    $("#VolumeSliderSeek").attr("style", "left: " + (x-10) + "px");
    $("#VolumeSliderh").attr("style", "width: " + ((x/max)*100) + "%");
}

function setSwipeThresholds() {
	if ( deviceType == "tablet") {
		HorzLongSwipeThreshold = $("#gestures_canvas").width() * 0.5;
		VertLongSwipeThreshold = $("#gestures_canvas").height() * 0.5;
	}

	if ( deviceType == "phone") {
		HorzLongSwipeThreshold = $("#gestures_canvas").width() * 0.8;
		VertLongSwipeThreshold = $("#gestures_canvas").height() * 0.7;
	}	
}

function onBodyLoad() {
    setTimeout( function () {
       if (typeof navigator.device !== "undefined"){
            document.addEventListener("deviceready", PhoneGapReady, false);
       } else {
            PhoneGapReady();
       }
    }, 10)
}

function getEGBaseUrl() {
	var room = getCurrentRoom();
	var devices = room.devices;
	for (var i=0;i<devices.length;i++) {
		if ( devices[i].shortname == "MCE" ) {
			return "http://" + devices[i].IPAddress + ":" + devices[i].Port + "/";
			break;
		}
	}
	return "";
}

function getMBUrl() {
	var room = getCurrentRoom();
	var devices = room.devices;
	for (var i=0;i<devices.length;i++) {
		if ( devices[i].shortname == "MCE" ) {
			return "http://" + devices[i].IPAddress + ":" + devices[i].ServicePort + "/mbwebapi/service/";
			break;
		}
	}
	return "";
}


function getCurrentDevice() {

	if (settings.rooms) {
		if (settings.rooms.length > 0) {
			if (settings.rooms[ settings.roomIndex ].devices.length > 0) {
				return settings.rooms[ settings.roomIndex ].devices[ settings.deviceIndex ];
			} else {
				return null;
			}
			
		} else {
			return null;
		}
	}

	
}

function getCurrentRoom() {
	return settings.rooms[ settings.roomIndex ];
}

function getDeviceByShortName(shortname) {
	var room = getCurrentRoom();
	for (var i=0;i<room.devices.length;i++) {
		if ( room.devices[i].shortname == shortname ) {
			return room.devices[i];
			break;
		}
	}
	return null;
}

function setDeviceByShortName(shortname) {
	var room = getCurrentRoom();
	for (var i=0;i<room.devices.length;i++) {
		if ( room.devices[i].shortname == shortname ) {
			settings.deviceIndex = i;
			return true;
			break;
		}
	}
	return false;
}

function getRoomStatus() {

	var url = getEGBaseUrl();
	$.ajax({
	    type: "GET",
		dataType: "text",
		url: url,
		success: function(resp) {
			settings.deviceIndex = 0;
			
			try {
				var obj = jQuery.parseJSON(resp);
				if ( obj.device != "" ) {
					var newDevice = getDeviceByShortName(obj.device);
					settings.deviceIndex = newDevice.index;
				}
			} catch(e) {

			}

			updateStatus()
		}
	});
}

function updateStatus() { 

	var device = getCurrentDevice();
	var room = getCurrentRoom();

	$("#txtDevice").text( device.name );
	$("#txtRoom").text( room.name );
	
	if (room.IR) {
		$("#overallVolumeContainer, #btnPower").show()
	} else {
		$("#overallVolumeContainer, #btnPower").hide()
	}
	setTimeout(function () {
    	nowPlaying()
	}, 500);
}

function hms2(totalSec) {
	if (totalSec <= 0 ) {
		return "0:00";
	}
	try {
		hours = parseInt( totalSec / 3600 ) % 24;
	    minutes = parseInt( totalSec / 60 ) % 60;
	    seconds = totalSec % 60;
	    return (hours)  + ":" + (minutes < 10 ? "0" + minutes : minutes) ;
	} catch(e) {
		return "0:00";
	}	    
}

function clearNowPlaying() {
	$("#bgPic").attr("class", "noart");
	$("#bgPic").attr("style", "");
	$("#bgPic").attr("data-id", ""); 
	$("#timespanleft").text( "0:00" )
	$("#timespanright").text( "- 0:00" );
	$("#NowPlayingTitle").text("");
}

function nowPlaying() {

	if ( $("#gestures_canvas:visible").size() == 0 ) {
		return;
	}

	var device = getCurrentDevice();

    if ( device.shortname == "MCE") {

       var base = getMBUrl();
       
        $.ajax({
               url: base + "ui",
               dataType: "json",
               timeout:10000,
               success: function(j) {
               		try {
               			var duration = j.Data.PlayingControllers[0].CurrentFileDuration.TotalSeconds;
               		} catch (e) {
               			return;
               		}
               		
					if ( j.Data.PlayingControllers.length >= 1 ) {

						var duration = j.Data.PlayingControllers[0].CurrentFileDuration.TotalSeconds;
						var offset = j.Data.PlayingControllers[0].CurrentFilePosition.TotalSeconds;
                   		var perc = offset / duration;

	    				$("#timebar").attr("style", "width: " + Math.floor(perc*100) + "%");
	    				$("#timeseek").attr("style", "left: " + ( $("#timebar").width() -10) + "px");
	    				$("#timespanleft").text( hms2(offset) )
	    				$("#timespanright").text( "- " + hms2(duration - offset) );
	    				$("#timespanright").attr("data-duration", j.Data.PlayingControllers[0].CurrentFileDuration.Ticks );
	    				$("#timespanright").attr("data-controller", j.Data.PlayingControllers[0].ControllerName );
  						$("#NowPlayingTitle").text( j.Data.PlayingControllers[0].PlayableItems[0].DisplayName );

	 					var currentID = j.Data.PlayingControllers[0].PlayableItems[0].CurrentMediaIndex;
	 					var guid = j.Data.PlayingControllers[0].PlayableItems[0].MediaItemIds[currentID];

	 					
	 					if ( $("#bgPic").attr("data-id") != guid ) {
	 						var imgID = "MB_Big_" + guid;
							getImageFromCache({id: imgID, url: base + "image/?Id=" + guid}, function(r) {

								var img = new Image();

								img.onerror = function() {
									$("#bgPic").attr("class", "noart");
									$("#bgPic").attr("style", "");
									$("#bgPic").attr("data-id", guid);
								};
								
								if (r.cached == false) { 
									img.onload = function() {
										saveImageToCache( {id: imgID, img: img } );
										$("#bgPic").attr("style", "background-image: url(" + r.url + ");");
										$("#bgPic").attr("class", "");
										$("#bgPic").attr("data-id", guid);
									};
									img.src = r.url;
								} else {
									console.log("using Cached: " + r.url.substring(0, 100) );
									$("#bgPic").attr("style", "background-image: url(" + r.url + ");");
									$("#bgPic").attr("class", "");
									$("#bgPic").attr("data-id", guid);
									//$("#bgPic").html("<img src='" + r.url + "' >")
								}
							});
							


	 					}
					
						if (j.Data.PlayingControllers[0].IsPaused == true ) {
							$("#btnPlay").removeClass("playing");
						} else {
							$("#btnPlay").addClass("playing");
						}

					} else {
						clearNowPlaying();
					}	                   		
						
	         }, 
	         error: function() {
	         	
	         }
             
        });
        
    }	

    if ( device.shortname == "DTV") {
 			
        $.ajax({
               type: "GET",
               url: "http://" + device.IPAddress + ":" + device.Port + "/tv/getTuned",
               dataType: "json",
               timeout: 10000,
               success: function(json) {
					
                   if (json.startTime) {
						if (json.startTime == "0" ) { return; }

                   		var perc = json.offset/json.duration;

	    				$("#timebar").attr("style", "width: " + Math.floor(perc*100) + "%");
	    				$("#timeseek").attr("style", "left: " + ( $("#timebar").width() -10) + "px");
	    				$("#timespanleft").text( hms2(json.offset) )
	    				$("#timespanright").text( "- " + hms2(json.duration - json.offset) )
  
                   }
                   var output = json.major + " " + json.callsign + " " + json.title;
                   $("#NowPlayingTitle").text( output );
					   $("#NowPlayingTitle").attr("data-item", json.callsign + json.major);
					   $("#NowPlayingTitle").attr("class", "");

                    $.ajax({
	                   type: "GET",
	                   url: "http://www.thetvdb.com/api/GetSeries.php?seriesname=" + json.title,
	                   dataType: "xml",
	                   error: function (x,y,z) {
	                   		$("#bgPic").attr("class", "noart");
	                   		$("#bgPic").attr("style", "");
	                   },
	                   success: function(tvxml) {
	                   		var url = "";
	                   		var guid = ""
	                   		$(tvxml).find("Data > Series > SeriesName").each(function () {
	                   			if ( $(this).text().toLowerCase().replace(/\W/g, '').replace('the', '') == json.title.toLowerCase().replace(/\W/g, '').replace('the', '') ) {
	                   				guid = $(this).parent().find("seriesid").text();
	                   				return false;	
	                   			}
	                   		});


	                   		if (guid == "" ) {
	                   			$("#bgPic").attr("class", "noart");
								$("#bgPic").attr("style", "");
	                   		} else {

		 						var imgID = "TVDB_" + guid;
								getImageFromCache({id: imgID, url: ""}, function(r) {
									if (r.cached == false) { 
										
										//query tvdb for the image
			                    		$.ajax({
						                   type: "GET",
						                   url: "http://thetvdb.com/api/77658293DB487350/series/" + guid + "/",
						                   dataType: "xml",
						                   error: function (x,y,z) {
						                   		$("#bgPic").attr("class", "noart");
						                   		$("#bgPic").attr("style", "");
						                   },
						                   success: function(seriesxml) {
						                   		var poster = $(seriesxml).find("poster:first")

						                   		if ( $(poster).size() > 0) {

													if ( $("#bgPic").attr("data-id") != guid  && $(poster).text() != "" ) {

														$("#bgPic").attr("style", "background-image: url('http://thetvdb.com/banners/_cache/" + $(poster).text() + "');")
														$("#bgPic").attr("class", "");
														$("#bgPic").attr("data-id", guid);

														//cache this result
														var img = new Image();
														img.onload = function() {
															saveImageToCache( {id: imgID, img: img } );
															console.log("cached")
														};
														img.src = "http://thetvdb.com/banners/_cache/" + $(poster).text() ;

								 					}
						                   		} else {
							                   		$("#bgPic").attr("class", "noart");
							                   		$("#bgPic").attr("style", "");
						                   		}
								 		
						                   }
						                 })
									} else {
										$("#bgPic").attr("style", "background-image: url(" + r.url + ");");
										$("#bgPic").attr("class", "");
										$("#bgPic").attr("data-id", guid);
									}
								});

	
	                   		}
	                   	}
	                });
					
					if ( parseInt($('#NowPlayingTitle')[0].scrollWidth) > parseInt($('#NowPlayingTitle').width())) {
					    $("#NowPlayingTitle").attr("class", "doMarquee")
					}
                   
                }
        });
        
    }
}

function clearCallers(force) {
	if (force == false) {
		var endedDivs = $("#gestureCallback div.dofadeout-final");
		$(endedDivs).remove();
	} else {
		$("#gestureCallback div").remove();
	}
}

function executeGestureByCommandName(command) {
	console.log(command)
	var room = getCurrentRoom();
	var device = getCurrentDevice();	

	//check if there's a global gesture for it
	var globals = $(xml).find("gesturePad > rooms > room[index='" + room.index + "'] ~ roomgestures > gesture > device > command > name:contains('" + command + "'):first");
	if ( $(globals).size() > 0 ) {

		var globalDevicetoTrigger = $(globals).parent().parent().attr("shortname");
		$(xml).find("gesturePad > devices > device[shortname='" + globalDevicetoTrigger + "'] > commands > category > command > name:contains('" + command + "'):first").each(function(){
			actionNodes = $(this).parent().find("action");	
			device = getDeviceByShortName(globalDevicetoTrigger); //replace the device with the global gesture device
			doEvent("manual", actionNodes, device) 
		});
	} else {
	//check for a regular command
		var commandNode = $(xml).find("gesturePad > devices > device[shortname='" + device.shortname + "'] > commands > category > command > name:contains('" + command + "'):first")
		if ( $(commandNode).size() == 1 ) {
			actionNodes = $(commandNode).next();	
			doEvent("manual", actionNodes, device);
		}
	}
}


function doEvent(gesture, actions, overRideDevice)  {
	window.scrollTo(0,0);
    
    
    if ( isWifi() == false ) {
        doAlert("You are not on Wifi. Connect to Wifi and try again")
        return;
    }

	clearCallers(false);

	var showCallback = true;
	if ($("#gestures_canvas:visible").size() == 0 ) {
		showCallback = false;
	}

	var message = $("<div class='message' style='display:none' data-gest='" + gesture + "'><span class='i'></span> <span class='t'>" + gesture + "</span></div>");

	if (showCallback) {
		$("#gestureCallback").append( message ); 
	}

	var room = getCurrentRoom();
	var device = getCurrentDevice();	

	if (typeof overRideDevice !== 'undefined') {
		device = overRideDevice;
	}

	var blnGoodGesture = true;
	var blnisGlobalGesture = false;

	if (gesture != 'manual') { //search for it in the XML

		//find a global command that matches the gesture
		$(xml).find("gesturePad > rooms > room[index='" + room.index + "'] ~ roomgestures > gesture[definition='" + gesture + "'] > device:first").each(function(){
			var globalDevicetoTrigger = $(this).attr("shortname");
			var globalCommandtoTrigger = $(this).find("command > name").text();
			
			$(xml).find("gesturePad > devices > device[shortname='" + globalDevicetoTrigger + "'] > commands > category > command > name:contains('" + globalCommandtoTrigger + "'):first").each(function(){
					blnisGlobalGesture = true;
					blnGoodGesture = true;
					actionNodes = $(this).parent().find("action");	
					device = getDeviceByShortName(globalDevicetoTrigger); //replace the device with the global gesture device
			});
		});

		//if not a global, find a device specific non-global command
		if (blnisGlobalGesture == false) {
			$(xml).find("gesturePad > devices > device[shortname='" + device.shortname + "'] > commands > category > command > gesture[definition='" + gesture + "']:first").each(function(){
				blnGoodGesture = true;
				actionNodes = $(this).parent().find("action");
			});	
		}

	} else { //adtion node is already supplied, so run em
		actionNodes = $(actions);
	}

	if (blnGoodGesture) {
		//Run commands for gesture
		playBeep();
		
		//show pending notification
		$(message).find("span.t").text( $(actionNodes).parent().find("name:first").text() + ' - ' + $(message).attr("data-gest") );
		$(message).find("span.i").text('🔄');
		$(message).show()

		$(message).animate({
			opacity: 1,
			width: '100%',
		}, 250, function() {
			var totalActions = ($(actionNodes).size()-1)
					
			//Trigger ajax events
			$(actionNodes).each(function(i) {
				var thisnode = $(actionNodes);

				//Look up url overrides
				var server = "http://" + device.IPAddress + ":" + device.Port + "/";
				$(this).find("addtobaseurl:first").each(function(){
					server = server + $(this).text();
				});

				$(this).find("replacebaseurl:first").each(function(){
					server = $(this).text();
				});

				$.ajax({
				    type: $(this).find("method:first").text(),
					url: server,
					data: $(this).find("data:first").text() + appendOncetoQueryString,
					timeout: 60000,
					dataType: $(this).find("dataType:first").text(),
					success: function(resp) {
						appendOncetoQueryString = "";
						if (i == totalActions) { //only run animation callback on final ajax call
							$(message).find("span.i").text('✅');
							$(message).animate({
								opacity: 0,
								width: '0%'
							}, 250, function() {
								if ( $(thisnode).find("onCompleteSetDevice").size() > 0) {
									setDeviceByShortName( $(thisnode).find("onCompleteSetDevice").attr("shortname") ); 
									updateStatus();
								}
								$(message).hide().remove();
							})
						}
						setTimeout(function() {
							nowPlaying();	
						}, 1500)
					},
					error: function() {
						appendOncetoQueryString = "";
						if (i == totalActions) { //only run animation callback on final ajax call
							$(message).find("span.i").text('❌');
							$(message).animate({
								opacity: 0,
								width: '0%'
							}, 250, function() {
								if ( $(thisnode).find("onCompleteSetDevice").size() > 0) {
									setDeviceByShortName( $(thisnode).find("onCompleteSetDevice").attr("shortname") ); 
									updateStatus();
								}
								$(message).hide().remove();

							})

						}
					}
				});
			});

		});		


			
	} else {
		//Unassigned gesture, just show and hide it
		$(message).find("span.i").text('❌');
		$(message).find("span.t").text( "Unassigned" + ' - ' + $(message).attr("data-gest")  );
		$(message).show();
		$(message).animate({
			opacity: 1,
			width: '100%'
		}, 250, function() {
			$(message).delay(500).animate({
				opacity: 0,
				width: '0%'
			}, 500, function() {
				$(message).remove();
			})

		})
	}
}

function playBeep() {
	if (settings.sounds) {
		try {
			navigator.notification.beep();	
		} catch (e) {;}	
	}
	if (settings.vibrate) {
		try {
			navigator.notification.vibrate(1000);
		} catch (e) {;}	
	}
}



/*
 * jQuery AjaxQ - AJAX request queueing for jQuery
 *
 * Version: 0.0.1
 * Date: July 22, 2008
 *
 * Copyright (c) 2008 Oleg Podolsky (oleg.podolsky@gmail.com)
 * Licensed under the MIT (MIT-LICENSE.txt) license.
 *
 * http://plugins.jquery.com/project/ajaxq
 * http://code.google.com/p/jquery-ajaxq/
 */

jQuery.ajaxq = function (queue, options)
{
	// Initialize storage for request queues if it's not initialized yet
	if (typeof document.ajaxq == "undefined") document.ajaxq = {q:{}, r:null};

	// Initialize current queue if it's not initialized yet
	if (typeof document.ajaxq.q[queue] == "undefined") document.ajaxq.q[queue] = [];
	
	if (typeof options != "undefined") // Request settings are given, enqueue the new request
	{
		// Copy the original options, because options.complete is going to be overridden

		var optionsCopy = {};
		for (var o in options) optionsCopy[o] = options[o];
		options = optionsCopy;
		
		// Override the original callback

		var originalCompleteCallback = options.complete;

		options.complete = function (request, status)
		{
			// Dequeue the current request
			document.ajaxq.q[queue].shift ();
			document.ajaxq.r = null;
			
			// Run the original callback
			if (originalCompleteCallback) originalCompleteCallback (request, status);

			// Run the next request from the queue
			if (document.ajaxq.q[queue].length > 0) document.ajaxq.r = jQuery.ajax (document.ajaxq.q[queue][0]);

			//console.log(document.ajaxq)
		};

		// Enqueue the request
		document.ajaxq.q[queue].push (options);

		// Also, if no request is currently running, start it
		if (document.ajaxq.q[queue].length == 1) document.ajaxq.r = jQuery.ajax (options);
	}
	else // No request settings are given, stop current request and clear the queue
	{
		if (document.ajaxq.r)
		{
			document.ajaxq.r.abort ();
			document.ajaxq.r = null;
		}

		document.ajaxq.q[queue] = [];
	}
}

$.fn.hasAttr = function(name) {  
   return this.attr(name) !== undefined;
};


function getImageFromCache(request, callback) {

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function gotFS(fileSystem) {
        	fileSystem.root.getFile(request.id + '.cache', {create: false, exclusive: false}, 
        		function gotFileEntry(fileEntry) {
        			fileEntry.file(
					    function readDataUrl(file) {
					        var reader = new FileReader();
					        reader.onloadend = function(evt) {
					            callback({cached: true, url: evt.target.result.toString() });
					        };
					        reader.readAsText(file); 
					    },
        				function fail(evt) { console.log("Error reading Cached File"); callback({cached: false, url: request.url }); }
        			);
    			},
				function fail(evt) { console.log("Cached file doesnt exist");  callback({cached: false, url: request.url }); }
			);
    	},
		function fail(evt) { console.log("Pull cache Error, no access to file system"); callback({cached: false, url: request.url }); }
	);

}

function saveImageToCache(request) {

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function gotFS(fileSystem) {
        	fileSystem.root.getFile(request.id + '.cache', {create: true, exclusive: false}, 
        		function gotFileEntry(fileEntry) {
        			fileEntry.createWriter( function gotFileWriter(writer) {
				            writer.onwriteend = function(evt) {
				                //console.log("Saved to cache: " + request.id)
				            };
				            writer.write( getBase64Image(request.img) );
	        			}, 
	        			function fail(evt) { console.log("Write to Cache Error");  }
        			);
    			},
				function fail(evt) { console.log("Error initiating cached file");  }
			);
    	},
		function fail(evt) { console.log("Save cache Error, no access to file system"); }
	);

}

function getBase64Image(img) {  
	var canvas = document.createElement("canvas");  
	canvas.width = img.width;  
	canvas.height = img.height;  
	var ctx = canvas.getContext("2d");  
	ctx.drawImage(img, 0, 0);  
	var dataURL = canvas.toDataURL("image/png"); 
	return dataURL;
}  


function getJsonFromCache(MBUrl, callback) {
	var id = MBUrl.replace("http://","");
	id = id.substring( id.indexOf("/")+1 );
	id = id.replace(/\//g,"-");

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function gotFS(fileSystem) {
        	fileSystem.root.getFile(id + '.json', {create: false, exclusive: false}, 
        		function gotFileEntry(fileEntry) {
        			fileEntry.file(
					    function readDataUrl(file) {
					        var reader = new FileReader();
					        reader.onloadend = function(evt) {
					            callback( jQuery.parseJSON( evt.target.result.toString() ) );
					        };
					        reader.readAsText(file); 

					    },
        				function fail(evt) { console.log("Error reading Cached File"); callback(null); }
        			);
    			},
				function fail(evt) { console.log("Cached file doesnt exist");  callback(null); }
			);
    	},
		function fail(evt) { console.log("Pull cache Error, no access to file system"); callback(null); }
	);

}

function saveJsonToCache(MBUrl, d) {

	if (d == null) {
		return;
	}
	var id = MBUrl.replace("http://","");
	id = id.substring( id.indexOf("/")+1 );
	id = id.replace(/\//g,"-");

	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
		function gotFS(fileSystem) {
        	fileSystem.root.getFile(id + '.json', {create: true, exclusive: false, append: false}, 
        		function gotFileEntry(fileEntry) {
        			fileEntry.createWriter( function gotFileWriter(writer) {
				            writer.onwriteend = function(evt) {
				                console.log("Saved to cache: " + id)
				            };
				            writer.write( JSON.stringify(d) );
	        			}, 
	        			function fail(evt) { console.log("Write to Cache Error");  }
        			);
    			},
				function fail(evt) { console.log("Error initiating cached json file");  }
			);
    	},
		function fail(evt) { console.log("Save cache Error, no access to file system"); }
	);

}

function doAlert(msg) {
	try {
		navigator.notification.alert(msg, null, "gesturePad");
	} catch (e) {
		alert(msg);
	}
	
}

function isWifi() {
	try {
		if ( netState() == 'WiFi connection' ) {
			return true;
		} else {
			return false;
		}
	} catch (e) {
		return true;
	}
}

function netState() {
	try {
	    var networkState = navigator.connection.type;
	    var states = {};
	    states[Connection.UNKNOWN]  = 'Unknown connection';
	    states[Connection.ETHERNET] = 'Ethernet connection';
	    states[Connection.WIFI]     = 'WiFi connection';
	    states[Connection.CELL_2G]  = 'Cell 2G connection';
	    states[Connection.CELL_3G]  = 'Cell 3G connection';
	    states[Connection.CELL_4G]  = 'Cell 4G connection';
	    states[Connection.NONE]     = 'No network connection';
	    return( states[networkState] );
	} catch (e) {
		return 'WiFi connection';
	}
}

function changeChannel(major) {
	var device = getCurrentDevice();
	// change channel
    $.getJSON("http://" + device.IPAddress + ":" + device.Port + '/tv/tune?major=' + major, function() {
		// update whats on
		setTimeout(function() {
			nowPlaying();
		}, 3000);
    })
}
function setItem(key, val) {
	localStorage.setItem(key, val);
}

function getItem(key, defaultVal) {
	try {
		return localStorage.getItem(key);
	} catch(e) {
		if (arguments.length == 1)  {
			return defaultVal;
		} else {
			return "";
		}
	}
}

function isPhoneGap() {
    return (cordova || PhoneGap || phonegap) 
    && /^file:\/{3}[^\/]/i.test(window.location.href) 
    && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent);
}

function hasDirecTV() {
	var retVal = false;
	for (var i=0;i<settings.rooms.length;i++) {
		if (settings.rooms[i].DTV != null) {
			retVal = true
			break;
		}
	}
	return retVal;
}
