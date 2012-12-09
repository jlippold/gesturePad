var xml;
var LongSwipeThreshold = 100;
var SleepThreshold = 15000;
var playSounds = "true";
var appendOncetoQueryString = "";
var navigator, npTimer, inputTimer, clickEventType, slideTimer;
var guide =  new Object();
var workerTimer = null;
var sleepTimer = null;
var scrollstop = null;
var recentChannels = new Array();


function setupWorker(channellist) {

	if  ( $(xml).find('gesturePad > rooms > room:first > device[shortname="DTV"]').size() == 0 ) {
		return;
	}

	guide.channels = new Array();

	//setup base structures
	$(channellist).find('channels > channel').each(function() {
	  	var channel = new Object();
	  	channel.number = $(this).find("number").text() ;
	  	channel.logo = $(this).find("logo").text();
	  	channel.callsign = $(this).find("callsign").text();
	  	channel.nowplaying = "";
	  	channel.ending = 0;
	  	channel.timeleft = "";
		guide.channels.push( channel );
	});

	startWorker();
}

function startWorker() {
	if (typeof navigator.device === "undefined") {
		return;
	} else {
		 
		//save all dtv servers to an array
			var dtvServers = new Array();
			var currentServer = 0;

			$(xml).find('gesturePad > rooms > room > device[shortname="DTV"]').each(function(){
				var DTVurl = ""
				$(this).find("IPAddress:first").each(function(){
					DTVurl = "http://" + $(this).text()
				});				
				$(this).find("Port:first").each(function(){
					DTVurl += ":" + $(this).text() + "/"
				});		
				dtvServers[currentServer] = DTVurl;
				currentServer += 1;
			});

			currentServer = 0;
		 	$.each(guide.channels, function(channelKey) { 
		 		var c = guide.channels[channelKey];

		 		//first determine if the channel needs a refresh
		 		if (c.nowplaying == "" || (c.ending) > (new Date).getTime() ) {
		 			c.nowplaying = "";
		 			//pick a server
			 		if ( currentServer > dtvServers.length-1 ) {
			 			currentServer = 0
			 		}
			 
		 			//queue the refesh on that server
		 			refreshChannel(dtvServers[currentServer], "DTVWorker"+currentServer, channelKey);
		 			currentServer += 1;
		 		}


			});
		 	clearTimeout(workerTimer)
			workerTimer = setTimeout( "startWorker()", 60000 );

	}
	
}

function refreshChannel(server, queueName, channelKey) {
	var c = guide.channels[channelKey];
	$.ajaxq(queueName, {
		url: server + 'tv/getProgInfo',
		dataType: "json",
		type: "GET",
		data: 'major=' + c.number,
		success: function(response) {
			c.nowplaying = response.title;
			c.timeleft = hms2( (response.startTime+response.duration) - Math.floor(new Date().getTime() / 1000)  );
			c.ending = (response.startTime+response.duration);

			if ( $("#tr"+channelKey).size() > 0 ) {
				var row = $("#tr"+channelKey);
				//update on screen info
				$(row).find("td:eq(1) div").text( c.nowplaying )
            	$(row).find("td:eq(2)").text( c.timeleft ) 
            	$(row).attr("data-loaded", "true")

			}

		}
	});
}

function clearSleepTimer() {
	SleepDevice(false);
 	clearTimeout(sleepTimer)
 	if (SleepThreshold > 0) {
		sleepTimer = setTimeout( "SleepDevice(true)", SleepThreshold );
 	}
}

function SleepDevice(sleep) {

	if (SleepThreshold > 0) {
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
  var iframe = document.createElement("IFRAME");
  iframe.setAttribute("src", url);
  document.documentElement.appendChild(iframe);
  iframe.parentNode.removeChild(iframe);
  iframe = null;
}


function onDeviceReady() {


	$.gestures.init();
	$.gestures.retGesture(function(gesture) {
		doEvent(gesture);
		clearSleepTimer();
	});
	
	doResize();

	clickEventType = ((document.ontouchstart!==null)?'click':'click'); //never inplemented custom tap

	//event when scrolling ends to refresh dtv channels
	$("#backFace").bind("scroll", function() {

		if (localStorage.getItem("shortname") != "DTV") {
			return;
		}
		clearTimeout(scrollstop);

		var dtvServers = new Array();
		var currentServer = 0;

		$(xml).find('gesturePad > rooms > room > device[shortname="DTV"]').each(function(){
			var DTVurl = ""
			$(this).find("IPAddress:first").each(function(){
				DTVurl = "http://" + $(this).text()
			});				
			$(this).find("Port:first").each(function(){
				DTVurl += ":" + $(this).text() + "/"
			});		
			dtvServers[currentServer] = DTVurl;
			currentServer += 1;
		});

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


	/* UI buttons */

	$('div.control').bind('touchstart', function(){
	    $(this).addClass('active');
	}).bind('touchend', function(){
	    $(this).removeClass('active');
	    clearSleepTimer()
	});

	$("#saveSettings").bind(clickEventType, function() {
		var gestureXML = $("#gestureXML").val();
		var channelXML = $("#channelXML").val();
		if (channelXML == "" ) {
			channelXML = null;
		}
		if (gestureXML == "" ) {
			gestureXML = null;
		}
		localStorage.setItem("gestureXML",  gestureXML );
		localStorage.setItem("channelXML",  channelXML );
			try {
				navigator.notification.alert("Settings Saved.", null, "gesturePad");
			} catch(e) {} 
		
		loadXML(); 
		$("#btnConfig").trigger(clickEventType);
		
	});
	
	$("#btnTitles").bind(clickEventType, function() {

		/* generic flip shit */
		if ( localStorage.getItem("roomname") == "" || localStorage.getItem("devicename") == "" ) { //No room selected
		    try {		        
		        navigator.notification.alert("Please Select a Room First", null, "gesturePad");
		    } catch (e) { }
		    $("#btnRoom").trigger(clickEventType);
		    return;
		}

		if ( $("#card").attr("class") == "doFlip" ) {
			$("#card").toggleClass("doFlip");
			$("#gestures_canvas").show();
			setTimeout(function() {
				$("#backFace").html( "" );	
				hideFilter()
			}, 200)
			return;
		} 
		$("#gestures_canvas").hide();
		$("#backFace").html( $("#tmpSpinner").html() );
		$("#card").toggleClass("doFlip");		
		var curChannel = $("#NowPlayingTitle").attr("data-item");

		if (localStorage.getItem("shortname") == "DTV") {
			
			//build table for channel list 
			

			var tb = "<table class='listing'>"
			//loop recents first 
			if (recentChannels.length > 0) {
				tb += "<tr class='head'><td colspan='3'>Recent Channels</td></tr>";
				$.each(recentChannels, function(idx, channelKey) { 
					if ( guide.channels[channelKey] ) {
						var c = guide.channels[channelKey];
						tb += getTableRowHTML(c, channelKey, curChannel);
					}
				});
			}
	
			if (recentChannels.length > 0) {
				tb += "<tr class='head'><td colspan='3'>Other Channels</td></tr>";
			}

		 	$.each(guide.channels, function(channelKey, c) { 
		 		if ( recentChannels[ parseInt(channelKey)-1 ] ) {
		 			//console.log("skipping" + (channelKey-1) )
		 		} else {
		 			//var c = guide.channels[channelKey];
					tb += getTableRowHTML(c, channelKey, curChannel);
		 		}
			});

			tb += "</table>"

			
				   
			$("#backFace").html( tb );
		     
		    checkScrollOverflow()
		    showFilter("DTV") 
			
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
		        var configNode = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname") +'"]');
		        if ($(configNode).size() > 0) {

					// save recent channel
					var channelKey = $(this).attr("data-key");
					if (isNumeric(channelKey) == false) {
						return;
					}
					var isRecent = recentChannels.indexOf(channelKey);
					if (isRecent > -1 ) {
						recentChannels.splice(isRecent, 1); //remove it
					}
					recentChannels.unshift(channelKey) //add it to the top
					if ( recentChannels.length > 10  ) { //remove > 10
						recentChannels.splice(11, recentChannels.length-10)
					}

					//save recents
					localStorage.setItem('recentChannels', JSON.stringify(recentChannels) );
					
					//flip screen
		   			$("#btnTitles").trigger(clickEventType);

					// change channel
		            $.getJSON("http://" + $(configNode).find("IPAddress").text() + ":" + $(configNode).find("Port").text() + '/tv/tune?major=' + $(this).attr("data-major"), function() {
						// update whats on
						setTimeout(function() {
							nowPlaying();
						}, 1500);
		            })
			     }
			});

		}

		if (localStorage.getItem("shortname") == "MCE") {
			/* populate it */

			var MBUrl = "";
			
			$(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname")  + '"]:first').each(function(){
				$(this).find("IPAddress:first").each(function(){
					MBUrl = "http://" + $(this).text()
				});				
				$(this).find("ServicePort:first").each(function(){
					MBUrl += ":" + $(this).text() + "/mbwebapi/service/library"
				});		
			});
			
			if (MBUrl == "" ) {
				MBUrl;
			}

			$.getJSON(MBUrl, function(d) {
				var tb =  "<table class='listing' style='width: " + $("#card").width() + "px !important'>"
				$.each(d.Data.Children, function(key, val) { 
					tb += '<tr data-guid="' + d.Data.Children[key].Id + '" data-type="'+ d.Data.Children[key].Type +'" >'
						+ '<td><div>' + d.Data.Children[key].Name  + '</div></td>'
					tb += '<td width="30px" style="text-align: right">' + d.Data.Children[key].ChildCount  + '</td></tr>';	
				});
				  tb += "</table>"
			     $("#backFace").html( tb );
			     checkScrollOverflow();
			     showFilter("MCE")
				
				$("#backFace table tr").bind(clickEventType, function () {
						ShowItems( $(this) );
				});

			});	
		}
		



	});

	
	$("#btnConfig").bind(clickEventType, function() {
		if ( $("#gestures_canvas").is(":visible") ) {
			$("#gestures_canvas").hide();
			$("#bgPic").attr("class", "noartnologo");
			$("#bgPic").attr("style", "");
			$("#frmSettings").show();
		} else {
			$("#gestures_canvas").show();
			$("#bgPic").attr("class", "noart");
			$("#frmSettings").hide();
			nowPlaying();
		}
	})

	$("#btnCommands").bind(clickEventType, function() {
		/* generic flip shit */
		if ( localStorage.getItem("roomname") == "" || localStorage.getItem("devicename") == "" ) { //No room selected
		    try {		        
		        navigator.notification.alert("Please Select a Room First", null, "gesturePad");
		    } catch (e) { }
		    $("#btnRoom").trigger(clickEventType);
		    return;
		}

		if ( $("#card").attr("class") == "doFlip" ) {
			$("#card").toggleClass("doFlip");
			$("#gestures_canvas").show();
			setTimeout(function() {
				$("#backFace").html( "" );	
				hideFilter()
			}, 200)
			return;
		} 
		$("#gestures_canvas").hide();
		$("#backFace").html( $("#tmpSpinner").html() );

		$("#card").toggleClass("doFlip");		

		/* populate it */
		var category = "";
		var tb = "<table class='listing'>"

		$(xml).find('gesturePad > devices > device[shortname="' + localStorage.getItem("shortname") + '"]').each( function() {

			var devicenode = $(this);
			var devicename = $(this).children("name:first").text();
			var roomname = localStorage.getItem("roomname");
			
			$(devicenode).find("command").each(function(index){
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
			 	
				tb += '<tr data-idx="' + index + '"> '
							+ '<td>' + ((gestureDefinition == "")?"":"👆 ") + commandname 
							+ '</td><td style="width:20%">' + gestureDefinition + '</td></tr>';
			});
		});
		tb += "</table>"
	
		$("#backFace").html( tb );
		checkScrollOverflow()
		showFilter("gesturelist");

		$("#backFace table tr").bind(clickEventType, function () {


			var i = $(this).attr("data-idx") ;
			var actions = $(xml).find('gesturePad > devices > device[shortname="' + localStorage.getItem("shortname") + '"] command:eq(' + i + ') action');
			doEvent("manual", actions);
		})

	});

	$("#VolumeContainer").bind("touchmove", function(event) {  
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
		    $("#VolumeSliderSeek").attr("style", "left: " + (x-10) + "px");
		    $("#VolumeSliderh").attr("style", "width: " + Math.floor(percentageDragged*100) + "%");
			
		
		    var MaxVolumeJump = 30;
	    	var seekTo = Math.round( MaxVolumeJump - (MaxVolumeJump * percentageDragged) );
		    var sendval = 0;
		    if ( seekTo >= (MaxVolumeJump/2) ) {
		    	//down
		    	sendval = (seekTo-(MaxVolumeJump/2));
		    	if (sendval > 0 ) {
				    $(this).attr("data-command", "VolumeDown");
				    $(this).attr("data-sendval", sendval);
				    
				    slideTimer = setTimeout(doSlideEvent, 500);
				}
			} else {
				// Up	
				sendval = ((MaxVolumeJump/2)-seekTo );
				if (sendval > 0 ) {
				    $(this).attr("data-command", "VolumeUp");
				    $(this).attr("data-sendval", sendval);
				    slideTimer = setTimeout(doSlideEvent, 500);
				}
			}
			
	});

	$("#seekbarContainer").bind("touchmove", function(event) {  
			clearSleepTimer()
			clearTimeout(slideTimer);
			if (localStorage.getItem("shortname") == "MCE") {
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
				     
				    slideTimer = setTimeout(doSeekEvent, 500);
			    }
			    

			}
	
	});

	$("#btnRoom").bind(clickEventType, function() {
		$("#frmRoom").show();
		$("#lstRooms").val("")
		$("#lstRooms").focus();
		$("#frmRoom").hide();
	});

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
	
	$("#btnSortDate").bind(clickEventType, function () {
		if ( $(this).hasClass("opaqueEmoji") ) {
			localStorage.setItem("SortDate", 1)
		} else {
			localStorage.setItem("SortDate", 0)
		}
		$(this).toggleClass("opaqueEmoji")
	});


	$("#header").bind(clickEventType, function() {
		//scrolltop
		if ( $("#backFace table").size() > 0 ) {
			$("#backFace").scrollTop(0);
		}
	})

	//list filering
	$("#Filter").bind("keyup", function(event) {
	    if (inputTimer) {
	        clearTimeout(inputTimer);
	    }
	     inputTimer = setTimeout(function () {
	    	var s = $("#Filter input.searcher").val().toLowerCase();
	    	$("#backFace tr").each(function() {
	    		var t = $(this).text().toLowerCase();
	    		if ( t.indexOf(s) == -1 ) {
	    			$(this).hide()
	    		} else {
	    			$(this).show()
	    		}
	    	})
	    }, 500);
	});

	$("#searchform").bind("submit", function(event) {
		event.preventDefault();
	})

	$("#top, #bottom, #toptrans").bind("touchmove", function(event) {
		event.preventDefault();
	})

	//generic keybind for number pad

	$("#btnNumberPad").bind(clickEventType, function() {
		$("#frmNumPad").show();
		$("#NumPad").focus();
		$("#frmNumPad").hide();
	});

	$("#frmNumPad").keyup(function(event) {
	   if (event.keyCode > 47 && event.keyCode < 58  ) {
	   		var shortname = localStorage.getItem("shortname") ;

		   	$(xml).find("gesturePad > devices > device[shortname='" + shortname + "'] > numberpad:first").each(function() {
		   		var main  = $(xml).find("gesturePad > rooms > room > name:contains('" + localStorage.getItem("roomname") + "') ~ device[shortname='" + shortname + "']")
				$.ajax({
				    type: $(this).find("method").text(),
					url: "http://" + $(main).find("IPAddress").text() + 
						":" +  $(main).find("Port").text() + 
						"/" + $(this).find("addtobaseurl").text() + String.fromCharCode(event.keyCode),
					dataType: $(this).find("dataType").text(),
					success: function(resp) {
						//alert("good");
					}
				});
		   	});
		event.preventDefault();	
	   }
	});

	loadXML(); 

 	npTimer = setInterval(function() {
      nowPlaying()
	}, 30000);

	clearSleepTimer();

}

function loadXML() {
	var xmlLoc = "gesturePad.xml?r=" + Math.random()
	if ( localStorage.getItem("gestureXML").toString() != 'null'  ) {
		xmlLoc = localStorage.getItem("gestureXML")
	}
	$.ajax({
	    type: "GET",
		url: xmlLoc,
		dataType: "xml",
		success: function(resp) {
          	xml = resp;
			loadSettings();
		},
		error: function() {

			try {
			navigator.notification.alert("Error loading settings: " + xmlLoc , null, "gesturePad");
			} catch(e) {} 
		}		
	});
}

function ShowItems(tr) {
	clearSleepTimer()

	var MBUrl = "";
	
	$(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname")  + '"]:first').each(function(){
		$(this).find("IPAddress:first").each(function(){
			MBUrl = "http://" + $(this).text()
		});				
		$(this).find("ServicePort:first").each(function(){
			MBUrl += ":" + $(this).text() + "/mbwebapi/service/"
		});		
	});
	
	if (MBUrl == "" ) {
		MBUrl;
	}

	if ( $(tr).attr("data-type") == "Movie" || $(tr).attr("data-type") ==  "Episode"  ) {
		//play title
		MBUrl += "ui?command=play&id=" + $(tr).attr("data-guid")
		$.getJSON(MBUrl, function(x) {
			$("#btnTitles").trigger(clickEventType);
			setTimeout(function() {
				nowPlaying();
			}, 1500)

         })
		return;
	}

	if ( $(tr).attr("data-type") == "Shuffle" ) {
		//play title
		MBUrl += "ui?command=shuffle&id=" + $(tr).attr("data-guid")
		$.getJSON(MBUrl, function(x) {
			$("#btnTitles").trigger(clickEventType);
			setTimeout(function() {
				nowPlaying();
			}, 1500)
         })
		return;
	}

	$.getJSON(MBUrl + "library?lightData=1&Id=" + $(tr).attr("data-guid"), function(x) {
		$("#backFace table").html( "" );
		tb = "";

		if ( x.Data.Name != "StartupFolder" ) {
			tb += '<tr data-guid="' + x.Data.parentId + '" data-type="Folder">'
				+ '<td colspan="2"><div>.. </div></td>';

			tb += '<tr data-guid="' + x.Data.Id + '" data-type="Shuffle">'
				+ '<td colspan="2" class="shuffle"><div> Shuffle </div></td>';
		}

		if (localStorage.getItem("SortDate") == 1 && x.Data.Name != "StartupFolder" ) {
			x.Data.Children.sort(function(a,b) { return Date.parse(b.DateCreated) - Date.parse(a.DateCreated) } );
		}
		
		$.each(x.Data.Children, function(key, val) { 
			tb += '<tr data-guid="' + x.Data.Children[key].Id + '" data-type="'+ x.Data.Children[key].Type +'">'
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
	})
}

function doSeekEvent() {
	var seek = $("#seekbarContainer").attr("data-sendval");
    if (localStorage.getItem("shortname") == "MCE") {
        var configNode = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname") +'"]');
        if ($(configNode).size() > 0) {
			var base = "http://" + $(configNode).find("IPAddress").text();
			base += ":" + $(configNode).find("ServicePort").text() + "/mbwebapi/service/"
			base += "ui?command=seek&value=" + seek + "&controllerName=" + $("#timespanright").attr("data-controller") ;
			$.getJSON(base, function() {
				setTimeout(function() {
					nowPlaying();
				}, 1500)
			 })
        }
    }
}

function doSlideEvent() {
	appendOncetoQueryString = "&" + $("#VolumeContainer").attr("data-sendval");
	executeGestureByCommandName($("#VolumeContainer").attr("data-command"));
	resetVolumeSlider();
}

function getTableRowHTML(c, channelKey, curChannel) {
	var row = ""
	if (c.nowplaying == "" || (c.ending) > (new Date).getTime() ) { //needs refresh
		row += '<tr id="tr' + channelKey + '" data-loaded="false" data-major="' + c.number + '" data-key="' + channelKey + '"><td width="50px" ' 
		if ( c.logo != "" ) {
			row += "style = 'background: url(" + c.logo + ") center no-repeat' > "  
		} else {
			row += 'style="text-align: center" >' + c.number
		}
		row += '</td>' +
		'<td><div ' + ((curChannel == c.callsign + c.number ) ? " id='ScrollToMe' " : "" ) + '>' +
		'</div></td>'+
		'<td width="30px" style="text-align: right">0:00</td></tr>';

	} else { //pull cached

		row += '<tr id="tr' + channelKey + '" data-loaded="true" data-major="' + c.number + '" data-key="' + channelKey + '"><td width="50px" ' 
		if ( c.logo != "" ) {
			row += "style = 'background: url(" + c.logo + ") center no-repeat' > " 
		} else {
			row += 'style="text-align: center" >' + c.number
		}
		row += '</td>' +
		'<td><div ' + ((curChannel == c.callsign + c.number ) ? " id='ScrollToMe' " : "" ) + '>' +
		c.nowplaying +
		'</div></td>'+
		'<td width="30px" style="text-align: right">' + c.timeleft +'</td></tr>';
	}
	return row;
}

function PhoneGapReady() {
    document.addEventListener("resume", onResume, false);
    document.addEventListener("pause", onBackground, false);
	window.onorientationchange = detectOrientation;
    window.onresize = detectOrientation;
    onDeviceReady();

}


function checkScrollOverflow() {
	if ( $("#backFace table").height() > $("#backFace").height() ) {
		$("#backFace").attr("style", "-webkit-overflow-scrolling : touch");
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
	//setTimeout(function () {
		$("#Filter div.emoji").hide()
		if (to == "DTV") {
			 $("#Filter div.dtv").show()
		}
		if (to == "MCE") {
			 $("#Filter div.mce").show()
		}

		$("#Filter input").val("");
		$("#Filter").fadeIn();
	//}, 500)
}

function hideFilter() {
	//setTimeout(function () {
		$("#Filter").fadeOut();
	//}, 1000)
}


function onResume() {
	SleepDevice(false);
	setTimeout(function () {
    	nowPlaying()
	}, 10)

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
 	$("#card").height( $("body").height() - ($("#top").outerHeight() + ( $("#bottom").outerHeight() / 2) ) )
	var h = $("#container").height() - ($("#top").outerHeight() + $("#bottom").outerHeight() + $("div.toptrans").outerHeight() -1) ;
	var w = $("body").width();
	$("#gestures_canvas").attr("height", h)
	$("#gestures_canvas").attr("width", w)
	$("#gestures_canvas").height(h)
	$("#gestures_canvas").width(w)


	resetVolumeSlider();
}

function resetVolumeSlider() {
	//set volume slider at center
    var max = $("#VolumeSlider").width();
    var x = max*0.5;
    $("#VolumeSliderSeek").attr("style", "left: " + (x-10) + "px");
    $("#VolumeSliderh").attr("style", "width: " + ((x/max)*100) + "%");
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


function loadSettings() {
	
	var roomname = "";
	var roomshortname = "";
	var devicename = "";
	var shortname = "";
	try {
		roomname = localStorage.getItem("roomname");
		roomshortname = localStorage.getItem("roomshortname");
	} catch (e) {
		
	}
	try {
		devicename = localStorage.getItem("devicename");
		shortname = localStorage.getItem("shortname");
	} catch (e) {
		
	}
	if (localStorage.getItem("SortDate") == 'null') {
		localStorage.setItem("SortDate", 0)
	}

	if (roomshortname != "") {
		if ( $(xml).find('gesturePad > rooms > room[roomshortname="' + roomshortname + '"]').size() == 0 ) {
			roomname = "";
			roomshortname = "";
		}
	}

	if (shortname != "") {
		if ( $(xml).find('gesturePad > rooms > room[roomshortname="' + roomshortname + '"] > device[shortname="' + shortname + '"]').size() == 0 ) {
			devicename = "";
			shortname = "";
		}
	}
	
	localStorage.setItem("roomname", roomname);
	localStorage.setItem("roomshortname", roomshortname);
	localStorage.setItem("devicename", devicename);
	localStorage.setItem("shortname", shortname);


	
	if (localStorage.getItem("recentChannels").toString() != 'null') {
	  recentChannels=JSON.parse(localStorage['recentChannels']);
	}

	if ( localStorage.getItem("gestureXML").toString() != 'null' ) {
		$("#gestureXML").val(  localStorage.getItem("gestureXML") )
	}

	if ( localStorage.getItem("channelXML").toString() != 'null' ) {
		$("#channelXML").val(  localStorage.getItem("channelXML") )
	}

	$(xml).find('gesturePad > settings > sounds:first').each(function() {
		playSounds = $(this).text();
	});
	
	$(xml).find('gesturePad > settings > LongSwipeThreshold').each(function() {
		try {
			LongSwipeThreshold = parseInt($(this).text());
		} catch (e) { }
	});

	$(xml).find('gesturePad > settings > SleepThreshold').each(function() {
		try {
			SleepThreshold = parseInt($(this).text());
		} catch (e) { }
	});

	//set buttons

	if ( localStorage.getItem("SortDate")  ==  1 ) {

	} else {
		$("#btnSortDate").addClass("opaqueEmoji")
	}


	//Populate room picker
	var toAppend = ""
	var toAppendNoSwitch = ""
	$(xml).find('gesturePad > rooms > room').each(function(){	
	 	var roomname = $(this).children("name:first").text();
	 	var roomshortname = $(this).attr("roomshortname");
	 	
	 	$(this).children("device[quickswitch='true']").each(function(){
		 	var devicename = $(this).children("name:first").text();
		 	var shortname = $(this).attr("shortname");
		 	toAppend += '<option data-switch="1" value="' + roomname + shortname + '" data-roomshortname="' + roomshortname + '" data-roomname="' + roomname + '" data-shortname="' + shortname + '" data-devicename="' + devicename + '">' + roomname + ' - ' + devicename + '</option>';
		 	toAppendNoSwitch += '<option data-switch="0"  value="0' + roomname + shortname + '" data-roomshortname="' + roomshortname + '" data-roomname="' + roomname + '" data-shortname="' + shortname + '" data-devicename="' + devicename + '">' + roomname + ' - ' + devicename + '</option>';
	 	});

	});

	$("#lstRooms").html( "<option value=''>Switch Inputs</option>" + toAppend + "<optgroup label='Dont Switch Inputs'>"  + toAppendNoSwitch + "</optgroup>" )
	$("#lstRooms").val("");

	//bind room swtich events
	$("#lstRooms").bind("change", function () {
		$("#btnPlay").addClass("playing");
		$(this).parent().submit();
 		localStorage.setItem("roomname", $(this).find("option:selected").attr("data-roomname") );
 		localStorage.setItem("devicename", $(this).find("option:selected").attr("data-devicename") );
 		localStorage.setItem("roomshortname", $(this).find("option:selected").attr("data-roomshortname") );
 		localStorage.setItem("shortname", $(this).find("option:selected").attr("data-shortname") );

 		if ( $(this).find("option:selected").attr("data-switch") == "1" ) {
	 		var switchshortname = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > roomgestures > gesture > device[switchesto="' + localStorage.getItem("shortname") + '"]').attr("shortname")
	 		doEvent("manual",  $(xml).find('gesturePad > devices > device[shortname="' + switchshortname + '"] > commands > category > command > action > onCompleteSetDevice[shortname="' + localStorage.getItem("shortname") + '"]:first').parent() );			 			
 		}

 		updateStatus();
	})


	var xmlLoc = "channellist.xml?r=" + Math.random();
	if ( localStorage.getItem("channelXML") != 'null' ) {
		xmlLoc = localStorage.getItem("channelXML")
	}

	$.ajax({
	    type: "GET",
		url: xmlLoc,
		dataType: "xml",
		success: function(resp) {
          	setupWorker(resp)
		},
		error: function() {
			navigator.notification.alert("Error loading channel list: "  + xmlLoc, null, "gesturePad");
		}		
	});

	updateStatus();

	

}




function updateStatus() { 
	try {
		$("#txtDevice").text( localStorage.getItem("devicename") );
	} catch (e) {
		
	}
	try {
		$("#txtRoom").text( localStorage.getItem("roomname") );
	} catch (e) {
		
	}
	setTimeout(function () {
    	nowPlaying()
	}, 500)

}

function hms2(totalSec) {
	if (totalSec < 0 ) {
		return "0:00"
	}
    hours = parseInt( totalSec / 3600 ) % 24;
    minutes = parseInt( totalSec / 60 ) % 60;
    seconds = totalSec % 60;
    return (hours < 10 ? "0" + hours : hours)  + ":" + (minutes < 10 ? "0" + minutes : minutes) ;
}

function clearNowPlaying() {
	$("#bgPic").attr("class", "noart");
	$("#bgPic").attr("style", "");
	$("#timespanleft").text( "0:00" )
	$("#timespanright").text( "- 0:00" );
	$("#NowPlayingTitle").text("");
}

function nowPlaying() {

	//generic repaint for disappearing ui elements
	$("#top, #bottom, #seekbarContainer, #toptrans").each(function() {
		$(this)[0].style.display='none';
		$(this)[0].offsetHeight; // no need to store this anywhere, the reference is enough
		$(this)[0].style.display='block';
	});

	if ( $("#frmSettings").is(":visible") ) {
		return;
	}

    if (localStorage.getItem("shortname") == "MCE") {
   
        var configNode = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname") +'"]');
        if ($(configNode).size() > 0) {

           var base = "http://" + $(configNode).find("IPAddress").text();
           base += ":" + $(configNode).find("ServicePort").text() + "/mbwebapi/service/"
          
            $.ajax({
                   url: base + "ui",
                   dataType: "json",
                   timeout:10000,
                   success: function(j) {
                   		clearNowPlaying();

	                   		
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
								$("#bgPic").attr("style", "background-image: url('" + base + "image/?Id=" + guid + "');")
								$("#bgPic").attr("class", "");
								$("#bgPic").attr("data-id", guid);
		 					}
						
							if (j.Data.PlayingControllers[0].IsPaused == true ) {
								$("#btnPlay").removeClass("playing");
							} else {
								$("#btnPlay").addClass("playing");
							}

							
		         }, 
		         error: function() {
		         	clearNowPlaying();
		         }
	             
            });
        
        }
    }	

    if (localStorage.getItem("shortname") == "DTV") {
   
        var configNode = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname") +'"]');
        if ($(configNode).size() > 0) {
 			
            $.ajax({
                   type: "GET",
                   url: "http://" + $(configNode).find("IPAddress").text() + ":" + $(configNode).find("Port").text() + "/tv/getTuned",
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
				                    $.ajax({
					                   type: "GET",
					                   url: "http://thetvdb.com/api/77658293DB487350/series/" + guid + "/",
					                   dataType: "xml",
					                   error: function (x,y,z) {
					                   		$("#bgPic").attr("class", "noart");
					                   		$("#bgPic").attr("style", "");
					                   },
					                   success: function(seriesxml) {
					                   		$(seriesxml).find("poster:first").each(function () {
												if ( $("#bgPic").attr("data-id") != guid ) {
													$("#bgPic").attr("style", "background-image: url('http://thetvdb.com/banners/_cache/" + $(this).text() + "');")
													$("#bgPic").attr("class", "");
													$("#bgPic").attr("data-id", guid);
							 					}
					                   		});
							 		
					                   }
					                 })
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
	//check if there's a global gesture for it
	var globals = $(xml).find("gesturePad > rooms > room[roomshortname='" + localStorage.getItem("roomshortname") + "'] > roomgestures > gesture > device > command > name:contains('" + command + "'):first")

	if ( $(globals).size() == 1 ) {
		var globalDevicetoTrigger = $(globals).parent().parent().attr("shortname");
		$(xml).find("gesturePad > devices > device[shortname='" + globalDevicetoTrigger + "'] > commands > category > command > name:contains('" + command + "'):first").each( function(){
				actionNodes = $(this).parent().find("action");	
				doEvent("manual", actionNodes) 
		});
	} else {
		var device = $(xml).find("gesturePad > devices > device[shortname='" + localStorage.getItem("shortname") + "'] > commands > category > command > name:contains('" + command + "'):first")
		if ( $(device).size() == 1 ) {
			actionNodes = $(device).next();	
			doEvent("manual", actionNodes) 
		}
	}
}

function doEvent(gesture, actions)  {
	
    
    try {
        if ( netState() != 'WiFi connection' ) {
            navigator.notification.alert("You do are not on Wifi. Connect to Wifi and try again", null, "gesturePad");
            return;
        }
    }
    catch (e) {
        
    }

	
	clearCallers(false);

	var showCallback = true;
	if ($("#gestures_canvas:visible").size() == 0 ) {
		showCallback = false;
	}

	var message = $("<div class='message' style='display:none' data-gest='" + gesture + "'><span class='i'></span> <span class='t'>" + gesture + "</span></div>");
	//$(message).insertBefore( $("#gestures_canvas") );
	if (showCallback) {
		$("#gestureCallback").prepend( message ); 
	}
	var blnGoodGesture = true;
	var blnisGlobalGesture = false;
	
	//is the gesture assigned?
	if (gesture != 'manual') {
		if ( localStorage.getItem("roomname") == "" || localStorage.getItem("devicename") == "" ) {
			blnGoodGesture = false;
		}
		if (blnGoodGesture) {
			
			//look up shortname for room.
			blnGoodGesture = false;
			var shortname = localStorage.getItem("shortname");
			$(xml).find("gesturePad > rooms > room[roomshortname='" + localStorage.getItem("roomshortname") + "'] > device[shortname=" + localStorage.getItem("shortname") + "]").each(function(){
				
				blnGoodGesture = true;
				
				//see if global gesture is there..
				$(this).parent().find("roomgestures > gesture[definition='" + gesture + "']:first").each(function(){
	
					var globalDevicetoTrigger = $(this).find("device:first").attr("shortname");
					var globalCommandtoTrigger = $(this).find("device:first > command > name").text();
					
					
					$(xml).find("gesturePad > devices > device[shortname='" + globalDevicetoTrigger + "'] > commands > category > command > name:contains('" + globalCommandtoTrigger + "')").each(function(i){
						if (i == 0) {
							actionNodes = $(this).parent().find("action");	
							blnisGlobalGesture = true;
							shortname = globalDevicetoTrigger;

						}
					});

				});
			});
			
			
			//lookup gesture
			if (blnGoodGesture == true && blnisGlobalGesture == false) {
				blnGoodGesture = false;
				$(xml).find('gesturePad > devices > device[shortname="' + shortname + '"]').find('gesture[definition="' + gesture + '"]:first').each(function(i){
					if (i == 0) {
						blnGoodGesture = true;
						actionNodes = $(this).parent().find("action");
					}
				});
			}
		}
	} else {
		actionNodes = $(actions);
		shortname = $(actions).parents("device").attr("shortname");
	}

	
	if (blnGoodGesture) {
		playBeep();
		

		//Run commands for gesture
		if (gesture != 'manual') {
			$(message).find("span.t").text( $(actionNodes).parent().find("name:first").text() + ' - ' + $(message).attr("data-gest")  );
			$(message).find("span.i").text('🔄');
			$(message).show().addClass("dofadein");
		} else {
			$(message).find("span.t").text( $(actionNodes).parent().find("name:first").text() + ' - ' + $(message).attr("data-gest") );
			$(message).find("span.i").text('🔄');
			$(message).show().addClass("dofadein");
		}

		$(message).bind("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend", function() {
			if ($(this).hasClass('dofadein') ) {
				$(this).addClass('dofadein-final');
			}
		});
		
		var totalActions = ($(actionNodes).size()-1)
				
		//Trigger ajax events
		$(actionNodes).each(function(i) {
			var thisnode = $(actionNodes);

			//Look up url overrides
			var server = "http://";

			$(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + shortname  + '"]:first').each(function(){
				$(this).find("IPAddress:first").each(function(){
					server += $(this).text();
				});				
				$(this).find("Port:first").each(function(){
					server += ":" + $(this).text() + "/";
				});				
			});
			
			$(this).find("addtobaseurl:first").each(function(){
				server = server + $(this).text();
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
						$(message).unbind("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend");
						$(message).bind("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend", function() {
							if ( $(thisnode).find("onCompleteSetDevice").size() > 0) {
								localStorage.setItem("devicename", $(thisnode).find("onCompleteSetDevice").text() );
								localStorage.setItem("shortname", $(thisnode).find("onCompleteSetDevice").attr("shortname"));
			 		
								updateStatus();
							}
							if ($(this).hasClass('dofadeout') ) {
								$(this).addClass('dofadeout-final');
							}
						});
						var t = setTimeout(function() {
							$(message).addClass('dofadeout');
						}, 200);
					}

					setTimeout(function() {
						nowPlaying();	
					}, 1500)
				},
				error: function() {
					appendOncetoQueryString = "";
					if (i == totalActions) { //only run animation callback on final ajax call
						$(message).find("span.i").text('❌');
						$(message).unbind("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend");
						$(message).bind("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend", function() {
							if ($(this).hasClass('dofadeout') ) {
								$(this).addClass('dofadeout-final');
							}
						});

						if ( $(thisnode).find("onCompleteSetDevice").size() > 0) {
							localStorage.setItem("devicename", $(thisnode).find("onCompleteSetDevice").text() );
							localStorage.setItem("shortname", $(thisnode).find("onCompleteSetDevice").attr("shortname"));
							updateStatus();
						}
							
						var t = setTimeout(function() {
							$(message).addClass('dofadeout');
						}, 200);
					}
				}
			});
		});

			
	} else {
		
		//Unassigned gesture, just show and hide it
		$(message).find("span.i").text('❌');
		$(message).find("span.t").text( "Unassigned" + ' - ' + $(message).attr("data-gest")  );
		
		$(message).show().addClass("dofadein");
		$(message).bind("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend", function() {
	
			if ($(this).hasClass('dofadein') ) {
				$(this).addClass('dofadein-final');
			}
			if ($(this).hasClass('dofadeout') ) {
				$(this).addClass('dofadeout-final');
			}
			var $this = $(this);
			var t = setTimeout(function() {
				$this.addClass('dofadeout');
			}, 500);
			

		});
	}
	
}

function playBeep() {
	if (playSounds == "true") {
		try {
			navigator.notification.beep();	
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


