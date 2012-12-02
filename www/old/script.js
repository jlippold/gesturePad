var xml;
var LongSwipeThreshold = 100;
var playSounds = "true";
var appendOncetoQueryString = "";
var navigator;

function showNumPad() {
	$("#frmNumPad").show();
	$("#NumPad").focus();
	$("#frmNumPad").hide();
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

var slideTimer;

function doSlideEvent() {
	appendOncetoQueryString = "&" + $("#seekbarContainer").attr("data-sendval");
	executeGestureByCommandName($("#seekbarContainer").attr("data-command"));
	$("#mainheader").trigger("click");
}


function doResize() {
    $("#pgGesture").show();
    $("#gesturecontainer").height( $(window).height() - (51+44) );
    $("#gestures_canvas").css({ position:'fixed', top:44, left:0, })
    .attr({ height: $(window).height() - (51+44) , width: $(window).width() })
    .show();
    nowPlaying();
}

function onDeviceReady() {

	$.mobile.activePage = $("#pgGesture");
	$.mobile.allowCrossDomainPages = true;
	//$.mobile.pushStateEnabled = true;
	$.support.cors = true;
	
    
	$.gestures.init();
	$.gestures.retGesture(function(gesture) {
		doEvent(gesture);
		nowPlaying();
	});
	
	
	$("#mainheader").bind("click", function() {
		if ( $("#seekbarContainer:visible").size() > 0 ) {
			$("#mainheader").attr("style", "height: 42px !important; overflow: hidden;");			
			$("#seekbarContainer").hide();	
			$("#gestures_canvas").show();
		}
	});
    

	
	$("#btnVolume").bind("click", function(event) {
		if ( $("#seekbarContainer:visible").size() > 0 ) {
			$("#mainheader").attr("style", "height: 42px !important; overflow: hidden;");			
			$("#seekbarContainer").hide();	
			$("#gestures_canvas").show();
		} else {
			$("#mainheader").attr("style", "height: 82px !important; overflow: hidden;");
			$("#seekbarContainer").show();	
			$("#gestures_canvas").hide();	
		}
		

		//set props
		$("#seekbarContainer").attr("data-type", "volume");
		$("#timespanleft").html("&nbsp;").css({"width": "4%"});
		$("#sliderbar").css({"width": "79%"});
		$("#timespanright").html("+/- 0"); 
		
		//set slider at center
	    var max = $("#sliderbar").width();
	    var x = max*0.5;
	    $("#seekto").attr("style", "left: " + (x-10) + "px");
	    $("#sliderh").attr("style", "width: " + ((x/max)*100) + "%");

		event.stopPropagation()
		//executeGestureByCommandName("Mute");
	});
						
		
	$("#seekbarContainer").bind("touchmove", function(event) {  
			clearTimeout(slideTimer);
			
			//event.preventDefault();
			var e = event.originalEvent;
		    var touch = e.touches[0]; 

		    var max = $("#sliderbar").width();
		    var x = touch.pageX;
		    if (x > max) {
		    	x = max;
		    }
		    
		    var percentageDragged =  x/max ;
		    $("#seekto").attr("style", "left: " + (x-10) + "px");
		    $("#sliderh").attr("style", "width: " + Math.floor(percentageDragged*100) + "%");
			
			if ( $(this).attr("data-type") == "volume" ) {
				$("#timespanright").html( percentageDragged  );
			    var MaxVolumeJump = 30;
		    	var seekTo = Math.round( MaxVolumeJump - (MaxVolumeJump * percentageDragged) );
			    var sendval = 0;
			    if ( seekTo >= (MaxVolumeJump/2) ) {
			    	sendval = (seekTo-(MaxVolumeJump/2));
			    	$("#timespanright").html( "- " + sendval  );
			    	if (sendval > 0 ) {
					    $(this).attr("data-command", "VolumeDown");
					    $(this).attr("data-sendval", sendval);
					    slideTimer = setTimeout(doSlideEvent, 500);
					}
				} else {
					// Up	
					sendval = ((MaxVolumeJump/2)-seekTo );
					$("#timespanright").html( "+ " + sendval  );
					if (sendval > 0 ) {
					    $(this).attr("data-command", "VolumeUp");
					    $(this).attr("data-sendval", sendval);
					    slideTimer = setTimeout(doSlideEvent, 500);
					}
				}
			}
	});
	
	$("#btnPower").bind("click", function() {
		executeGestureByCommandName("Power");
	});
	$("#btnPlay").bind("click", function() {
		executeGestureByCommandName("Play");
	});
	$("#btnPause").bind("click", function() {
		executeGestureByCommandName("Pause");
	});
	$("#btnStop").bind("click", function() {
		executeGestureByCommandName("Stop");
	});
	$("#btnSearch").bind("click", function() {
		executeGestureByCommandName("Search");
	});
	
	$("#btnRewind, #btnForward").bind("click", function() {
		var direction = "Forward"
		if ( $(this).attr("id") == "btnRewind" ) {
			direction = "Back"
		}
		
		if ( $(xml).find("gesturePad > rooms > room[roomshortname='" + localStorage.getItem("roomshortname") + "'] > device[shortname='" + localStorage.getItem("shortname") + "']").attr("timeshift") == "false"  ) {
			if ( direction = "Back" ) {
				executeGestureByCommandName("Forward");
				executeGestureByCommandName("Forward");
				executeGestureByCommandName("Forward");	
			} else {
				executeGestureByCommandName("Rewind");
				executeGestureByCommandName("Rewind");
				executeGestureByCommandName("Rewind");
			}
		} else {
			$("#skip").parent().remove();
			var str = "<div style='display:none'><select id='skip'><option value=''>No Skip</option><option value='1'>1 Minute " + direction + "</option>"
			for (i=5;i<=60;i+=5) {
				str += "<option value='" + i + "'>" + i + " Minutes " + direction + "</option>"
			}
			str += "</select><div>"
			
			$(this).parent().append(str)
			
			$("#skip").bind("change", function() {
				
				var command = "Skip " + direction
				var multiplier = $(this).val();			
	
				if ( multiplier.length == 1 ) {
				 	multiplier = "0" + multiplier
				}
			   	$(xml).find("gesturePad > rooms > room[roomshortname='" + localStorage.getItem("roomshortname") + "'] > device[shortname='" + localStorage.getItem("shortname") + "'] > baseurl:first").each(function() {
					var burl = $(this).text();
					console.log(multiplier)
			   		for (var i=0;i<multiplier.length;i++) {
						$.ajax({
						    type: "GET",
							url: burl + "num" + multiplier.charAt(i),
							dataType: "xml",
							success: function(resp) {
								//alert("good");
							}
						});
					}
					setTimeout( function () {
						executeGestureByCommandName(command);
					}, 1000);
	
			   	});
	
				$("#btnVolume").focus();
				$("#skip").parent().remove();
			});
			
			$("#skip").parent().show();
			$("#skip").focus();
			$("#skip").parent().hide();
		}

	});
	
	$("#myfooter, #pgMode, #mainheader").bind("touchmove", function (e) {
		e.preventDefault()
	})


	//generic keybind for number pad
	$("#frmNumPad").keyup(function(event) {
	   if (event.keyCode > 47 && event.keyCode < 58 && $("#ActionList form div.uifocus").size() == 0 ) {
	   	var shortname = $("#numpadcontainer").attr("data-shortname");
		   	$(xml).find("gesturePad > devices > device[shortname='" + shortname + "'] > numberpad:first").each(function() {
				$.ajax({
				    type: $(this).find("method").text(),
					url: $(xml).find("gesturePad > rooms > room > name:contains('" + localStorage.getItem("roomname") + "') ~ device[shortname='" + shortname + "'] > baseurl:first").text() + $(this).find("addtobaseurl").text() + String.fromCharCode(event.keyCode),
					dataType: $(this).find("dataType").text(),
					success: function(resp) {
						//alert("good");
					}
				});
		   	});
		event.preventDefault();	
	   }
	});
	
	


	
	$(document).bind("pagehide", function( e, data ) {
		if ( $.mobile.activePage.attr("id") == "pgGesture" || $.mobile.activePage.attr("id") == "pgAction" || $.mobile.activePage.attr("id") == "pgMode" ) {
			//setTimeout( function () {
				$("body > div[data-origq]").remove();	
			//}, 10)
		}
	});
	
	$(document).bind("pagebeforechange", function( e, data ) {
        urlObj = $.mobile.path.parseUrl(data.toPage);
        if (typeof data.toPage === "string")
        {
                page_name = urlObj.hash;
                clearCallers(true);
                if (page_name == "#pgMode" || page_name == "#pgAction" ) {
                	$("#gestures_canvas").hide();
                	createLists(page_name);
                	 setTimeout(function() {
                	 	if (page_name == "#pgMode") {
                	 		//$("#ModeList ul").listview();
       
                	 	} else {
                	 		$("#ActionList ul").listview();
                	 	}
                	 }, 1);
                	 
               	} else if (page_name == "#MB|Play") {
               		//e.preventDefault();
               		getMetaData($('#playdialog').attr('data-guid'), data.options)
					//return;
                } else {
                	$("#gestures_canvas").hide();
                	if ( $("body > div[data-origq='" + page_name.substring(4, 9999) + "']:first").size() == 1 ) {
                		$.mobile.changePage( $("body > div[data-origq='" + page_name.substring(4, 9999) + "']:first"), data.options )
                		
                		return;
                	}

                	if (page_name.substring(1, 3) == "MB" ) {
                		queryServer(page_name.substring(4, 9999), urlObj, data.options);
						e.preventDefault();
                	} else { 
						$("#ActionList").html("");
						$.mobile.activePage = $("#pgGesture");
						$("#gestures_canvas").show();
                	}

                }
        }
	});
	
	
	$.ajax({
	    type: "GET",
		url: "gesturePad.xml",
		dataType: "xml",
		success: function(resp) {
			
           xml = resp;
			loadSettings();
		},
		error: function() {
			navigator.notification.alert("Error loading settings", null, "gesturePad");
		}		
	});
	
    doResize();
	

	

}

function PhoneGapReady() {
 
    document.addEventListener("resume", onResume, false);
    document.addEventListener("pause", onBackground, false);
    
	window.onorientationchange = detectOrientation;
    window.onresize = detectOrientation;

    onDeviceReady();

}

function clearCanvas() {
  var canvas = document.getElementById("gestures_canvas");
  var ctx  = canvas.getContext('2d');
	// Store the current transformation matrix
	ctx.save();
	// Use the identity matrix while clearing the canvas
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Restore the transform
	ctx.restore();
}


function nowPlaying() {

    if (localStorage.getItem("shortname") == "MetaB") {
   
        var configNode = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname") +'"]');
        if ($(configNode).size() > 0) {

           var base = $(configNode).find("baseurl").text();
           base = base.substring( base.indexOf("/mce/") + 5)
           base = "http://" + base.substring(0, base.length -1 ) + ":8092/mbwebapi/service/"

          var canvas = document.getElementById("gestures_canvas");
          var ctx  = canvas.getContext('2d');
            $.ajax({

                   url: base + "ui",
                   dataType: "json",
                   success: function(j) {

 						var guid = j.Data.PlayingControllers[0].PlayableItems[0].MediaItemIds[0]
		                   $("body").append( "<img id='tmpPic' src='" + base + "image/?Id=" + guid + "' style='visibility: hidden; width: auto;px; height: " + (canvas.height-200) + "px' />");
		                   var w = $("#tmpPic").width();
		                   var h = $("#tmpPic").height();
		                   $("#tmpPic").remove();
		    
		                   var img = new Image();
		                   img.onload = function() {
		                   	  clearCanvas();
			                  ctx.save();
			                  ctx.globalAlpha = 0.4;
			                  var x = (canvas.width/2) - (w/2);
			                  var y = (canvas.height/2) - (h/2);
			                  ctx.drawImage(img,x,y,w,h);
			                  ctx.restore();		                
		                   };

		                   img.onerror = function() {
		                   	 img.src = "img/mb.png";
		                   };

		                   img.src = base + "image/?Id=" + guid + "&height=" + $(window).height();

	                }

            });
        
        }
    }	

    if (localStorage.getItem("shortname") == "DTV") {
   
        var configNode = $(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + localStorage.getItem("shortname") +'"]');
        if ($(configNode).size() > 0) {
           
          var canvas = document.getElementById("gestures_canvas");
          var ctx  = canvas.getContext('2d');
		 
            $.ajax({
                   type: "GET",
                   url: $(configNode).find("baseurl").text() + "tv/getTuned",
                   dataType: "json",
                   success: function(json) {
  						alert(json.major)
	                   var output = json.major + " " + json.callsign + " " + json.title;

	                   //if (json.startTime) {
	                   		alert("ad")
	                   		var sdate = new Date(json.startTime);
	                   		var edate = new Date(json.startTime + json.duration);
	                   		var now = new Date()
							alert( sdate-edate)
	                       // output += "<br />" + json.episodeTitle ;
	                   //}
	                   //output += "<br />" + parseInt(((json.duration - json.offset) / 60)) + " minutes left"

	                   $("#txtRoom").html( localStorage.getItem("roomname") + "<br />" + output );
	                    

	                    $.ajax({
		                   type: "GET",
		                   url: "http://www.thetvdb.com/api/GetSeries.php?seriesname=" + json.title,
		                   dataType: "xml",
		                   error: function (x,y,z) {
		                   		img.src = "img/dtv.png";
		                   },
		                   success: function(tvxml) {
		                   		var found = false	
		                   		var url = ""
		                   		$(tvxml).find("Data > Series > SeriesName").each(function () {
		                   			if ( $(this).text().toLowerCase().replace(/\W/g, '').replace('the', '') == json.title.toLowerCase().replace(/\W/g, '').replace('the', '') ) {
		                   				url = "http://thetvdb.com/banners/_cache/posters/" + $(this).parent().find("seriesid").text() + "-1.jpg";
		                   				found = true;
		                   				return false;	
		                   			}
		                   		});
		                   		if (found == false ) {
		                   			url = "img/dtv.png";
		                   		} 

				                   $("body").append( "<img id='tmpPic' src='" + url + "' style='visibility: hidden; width: auto;px; height: " + (canvas.height-200) + "px' />");
				                   var w = $("#tmpPic").width();
				                   var h = $("#tmpPic").height();
				                   $("#tmpPic").remove();
				    
				                   var img = new Image();
				                   img.onload = function() {
				                   	  clearCanvas();
					                  ctx.save();
					                  ctx.globalAlpha = 0.4;
					                  var x = (canvas.width/2) - (w/2);
					                  var y = (canvas.height/2) - (h/2);
					                  ctx.drawImage(img,x,y,w,h);
					                  ctx.restore();		                
				                   };

				                   img.onerror = function() {
				                   	 img.src = "img/dtv.png";
				                   };

				                   img.src = url;

		                   	}
		                });
	                   
	                }
            });
        
        }
    }
}


function detectOrientation(){
    if(typeof window.onorientationchange != 'undefined'){
        doResize();
    }
}

function dateDiff(start, end) {
    
}

function netState() {
    var networkState = navigator.network.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.NONE]     = 'No network connection';
    return states[networkState];
}

function onBackground() {
	var myDate = new Date();
	var EpochDate = myDate.getTime()/1000.0;
	$("#lastSeen").val( EpochDate ) 
}

function reloadPage() {
		var url = window.location.href;
		if (url.indexOf("?") > 0) {
			url = url.substring(0, url.indexOf("?"));
		}
		if (url.indexOf("#") > 0) {
			url = url.substring(0, url.indexOf("#"));
		}
		window.location.href = url;
}

function onResume() {
	var myDate = new Date();
	var EpochDate = myDate.getTime()/1000.0;
	var lastEpochDate = parseFloat( $("#lastSeen").val() );
	
	if ( (EpochDate -lastEpochDate) > 600 ) { //backgrounded for more than 10 minutes
		//reload the page to clear the DOM
		reloadPage();
	}
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
	
	$(xml).find('gesturePad > settings > sounds:first').each(function() {
		playSounds = $(this).text();
	});
	
	$(xml).find('gesturePad > settings > LongSwipeThreshold').each(function() {
		try {
			LongSwipeThreshold = parseInt($(this).text());
		} catch (e) { }
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
    nowPlaying()

}


function createLists(pagename) {

	if (pagename == "#pgMode") {
		if ( $(pagename).attr("data-loaded") == "false" ) {
			$(pagename).attr("data-loaded", "true");
			//Load Rooms & Modes
			
			$(xml).find('gesturePad > rooms > room').each(function(){
			 	var roomname = $(this).children("name:first").text();
			 	var roomshortname = $(this).attr("roomshortname");
			 	//$("#ModeList").append(  );
				var ul = $('<div data-role="collapsible" data-iconpos="right" data-theme="b" data-content-theme="d" data-collapsed="false"><h3>' + roomname + '</h3><fieldset class="ui-grid-b"><div class="ui-block-a"><button data-theme="f" data-roomname="' + roomname + '" data-roomshortname="' + roomshortname + '">Power</button></div></fieldset></div>');
				var s = "a";
			 	$(this).children("device[quickswitch='true']").each(function(){
				 	var devicename = $(this).children("name:first").text();
				 	var shortname = $(this).attr("shortname");
				 	if (s == "a") {
				 		s = "b"
				 	} else if (s == "b") {
				 		s = "c"
				 	} else {
				 		s = "a"
				 	}
				 	if (localStorage.getItem("roomname") == roomname && localStorage.getItem("devicename") == devicename ) {
				 		var mli = $('<div class="ui-block-' + s + '"><button data-theme="g" data-roomshortname="' + roomshortname + '" data-roomname="' + roomname + '" data-shortname="' + shortname + '" data-devicename="' + devicename + '" >' + devicename + '</button></div>');
				 	} else {
				 		var mli = $('<div class="ui-block-' + s + '"><button data-theme="c" data-roomshortname="' + roomshortname + '" data-roomname="' + roomname + '" data-shortname="' + shortname + '" data-devicename="' + devicename + '" >' + devicename + '</button></div>');	
				 	}
				 	
				 	$(ul).find("fieldset").append( $(mli) );

			 	});
			 	$("#ModeList").append( $(ul) );
			});	
				
		 	$("#ModeList").find("button").bind("vclick", function() {
		 		if ( $(this).text() == "Power" ) {
			 		localStorage.setItem("roomname", $(this).attr("data-roomname") );
			 		localStorage.setItem("roomshortname", $(this).attr("data-roomshortname") );
			 		localStorage.setItem("devicename", $(xml).find('gesturePad > rooms > room[roomshortname="' +  $(this).attr("data-roomshortname") + '"] > device:first > name').text() );
			 		localStorage.setItem("shortname", $(xml).find('gesturePad > rooms > room[roomshortname="' +  $(this).attr("data-roomshortname") + '"] > device:first').attr("shortname") );
			 		updateStatus();
		 			var a = $(this);
		 			var switchshortname = $(xml).find('gesturePad > rooms > room[roomshortname="' +  $(this).attr("data-roomshortname") + '"] > device[quickswitch="false"]').attr("shortname");
		 			doEvent("manual",  $(xml).find('gesturePad > devices > device[shortname="' + switchshortname + '"] > commands > category > command > name:contains("Power")').next() );
					setTimeout(function() {
						$(a).removeClass("ui-btn-active").removeClass("ui-btn-hover-c");
					}, 500);
		 		} else {
			 		localStorage.setItem("roomname", $(this).attr("data-roomname") );
			 		localStorage.setItem("devicename", $(this).attr("data-devicename") );
			 		localStorage.setItem("roomshortname", $(this).attr("data-roomshortname") );
			 		localStorage.setItem("shortname", $(this).attr("data-shortname") );
			 		updateStatus();
			 		if ( $("#flip-b").val() == "Yes" ) {
				 		var switchshortname = $(xml).find('gesturePad > rooms > room[roomshortname="' +  $(this).attr("data-roomshortname") + '"] > device[quickswitch="false"]:first').attr("shortname")
				 		doEvent("manual",  $(xml).find('gesturePad > devices > device[shortname="' + switchshortname + '"] > commands > category > command > action > onCompleteSetDevice[shortname="' + $(this).attr("data-shortname") + '"]:first').parent() );			 			
			 		}
			 		history.back();
		 		}
		 	});
		 	
		 	$("#ModeList").append( '<select name="slider" id="flip-b" data-role="slider" data-inline="true"><option value="No">Dont Switch</option><option value="Yes" selected="selected">Switch Inputs</option></select>');
		 	
		} else {
			$("#ModeList button").each(function() {
				if ( $(this).text() != "Power") {
					$(this).attr("data-theme", "c");
					$(this).parent().attr('class', 'ui-btn ui-btn-corner-all ui-shadow ui-btn-up-c');					
				}

			});
			$("#ModeList button[data-roomshortname='" + localStorage.getItem("roomshortname") + "'][data-devicename='" + localStorage.getItem("devicename") + "']").parent().attr('class', 'ui-btn ui-btn-corner-all ui-shadow ui-btn-up-g').find("button").attr("data-theme", "c");
		}
	}
	

	if (pagename == "#pgAction") {
		//Load all actions for the room
		if ( localStorage.getItem("roomname") == "" || localStorage.getItem("devicename") == "" ) { //No room selected
			$("#ActionList").append('<p>&nbsp;</p><h2>Please select a room first.</h2><p>&nbsp;</p>');
			return;
		}

		//$("#ActionList").append('<h2>' + localStorage.getItem("roomname") + ' ' + localStorage.getItem("devicename") + '</h2>');
		
		var category = "";
		var ul = $('<ul data-role="listview" data-filter="true"  data-theme="d"></ul>');
		var toFind = "";
		
			
		$(xml).find('gesturePad > devices > device[shortname="' + localStorage.getItem("shortname") + '"]').each(function(){
			
			if ($(this).attr("useNumberPad") == "true") {
				$("#numpadcontainer").show().attr("data-shortname", $(this).attr("shortname"));
			} else {
				$("#numpadcontainer").hide();
			}
			var devicenode = $(this);
			var devicename = $(this).children("name:first").text();
			var roomname = localStorage.getItem("roomname");
			
			$(devicenode).find("command").each(function(){
				var actions = $(this).find("action");
				var gestureDefinition = "";
				var commandname = $(this).children("name:first").text();
			
				$(this).find("gesture").each(function(i){ 
					if (i==0) {
						gestureDefinition = ""
						gestureDefinition = gestureDefinition + " <span class='ui-li-count'>" + $(this).attr("definition") + "</span>";
					} else {
						//gestureDefinition = gestureDefinition + " / " + $(this).attr("definition") ;
					}
				});
				
			 	if (category != ( $(this).parent().children("name:first").text() ) ) {
			 		category = $(this).parent().children("name:first").text();
			 		$(ul).append( $('<li data-role="list-divider" >'+ category + '</li>') );
			 	}
			 	
				var mli = $('<li><a href="#" data-roomname="' 
							+ roomname 
							+ '" data-devicename="' 
							+ devicename 
							+ '" >' + commandname + ' ' + gestureDefinition
							+'</a></li>');
							
				 	$(mli).find("a").bind("vclick", function() {
				 		//history.back();
						//var t = setTimeout(function() {
							doEvent("manual", actions);
						//}, 1000);
				 	});
				 	
				 $(ul).append( $(mli) );
				 
			});
	
		});
		
		$("#ActionList").append( $(ul) );
		
	}

}

function clearCallers(force) {
	if (force == false) {
		var endedDivs = $("#gesturecontainer div.dofadeout-final");
		//var visibleDivs = $("#gesturecontainer div:not(.dofadeout-final)");
		//if ( $(endedDivs).size() > 0 || ($(endedDivs).size() > 2) ) {
			$(endedDivs).remove();
		//}
	} else {
		$("#gesturecontainer div").remove();
	}
}

function doEvent(gesture, actions)  {
	
    if (gesture != 'manual') {
		if ( $.mobile.activePage.attr("id") != "pgGesture") {
			return;	
		}
    }
    
    try {
        if ( netState() != 'WiFi connection' ) {
            navigator.notification.alert("You do are not on Wifi. Connect to Wifi and try again", null, "gesturePad");
            return;
        }
    }
    catch (e) {
        
    }

	
	clearCallers(false);

	var message = $("<div class='message' style='display:none'><h3>&nbsp;</h3><p>" + gesture + "</p></div>");
	$(message).insertBefore( $("#gestures_canvas") );
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
			$(message).css('background', 'url("images/wifi.png") no-repeat 20px center #222222').find("h3").text( $(actionNodes).parent().find("name:first").text() );
			$(message).show().addClass("dofadein");
		} else {
			$(message).css('background', 'url("images/wifi.png") no-repeat 20px center #222222').find("h3").text( $(actionNodes).parent().find("name:first").text() );
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
			var server = "";

			$(xml).find('gesturePad > rooms > room[roomshortname="' + localStorage.getItem("roomshortname") + '"] > device[shortname="' + shortname + '"]:first').each(function(){
				$(this).find("baseurl:first").each(function(){
					server = $(this).text();
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
						$(message).css('background', 'url("images/checkmark.png") no-repeat 20px center #222222');
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
				},
				error: function() {
					appendOncetoQueryString = "";
					if (i == totalActions) { //only run animation callback on final ajax call
						$(message).css('background', 'url("images/stop.png") no-repeat 20px center #222222');
						
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
		$(message).css('background', 'url("images/warning1.png") no-repeat 20px center #222222').find("h3").text("Unassigned");
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
			
			//navigator.notification=new Notification();
			//navigator.notification.vibrate();

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





/* mediabrowser stuff */

var baseURL = "http://192.168.1.119:7000/"
var dbRev = "db101";

function custom_sort(a, b) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
	
function checkCache(lib, query) {
	query = query.split("&Search=")[0];
	var titles = lib.query("titles", {source: query} );
	return titles.length;
}

function queryServer(query, urlObj, options) {

	$.mobile.showPageLoadingMsg();
	
	query = query.replace(/\|/gi, "/")

	var lib = new localStorageDB(dbRev);
	
	if( lib.isNew() || lib.tableExists("titles") == false ) {
		lib.createTable("titles", ["itemid", "itemtype", "itemname", "source", "date", "year", "rating", "path"]);
		lib.commit();
	}
	

	
	if ( checkCache(lib, query) == 0 ) {

		$.ajax({
			url: baseURL + query,
			dataType: "xml",
			async: false,
			success:function(xml){
				
				$(xml).find("group").each(function(){
					var itemid = $(this).text();
					var itemtype = 'home';
					var itemname = $(this).text();
					var path = 'home';
					var source = 'home';
					var date = '';
					var year = '';
					var rating = '';
					lib.insert("titles", {itemid: itemid, itemtype: itemtype, itemname: itemname, source: query, date: date, year: year, rating: rating, path: path});
				});
				
				$(xml).find("media").each(function(){
					var itemid = $(this).find("id").text();
					var itemtype = $(this).attr("type");
					var itemname = $(this).find("name").text();
					if (itemtype == "season") {
						itemname = itemname + " " + $(this).find("seasonnumber").text();
					}
					if (itemtype == "episode") {
						itemname = pad( $(this).find("episodenumber").text() , 2) + " " +  itemname;
					}
					var path = $(this).find("path").text();
					var source = query; //$(this).find("sortname").text();
					var date = $(this).find("dateadded").text();
					var year = $(this).find("productionyear").text();
					var rating = $(this).find("rating").text();
					lib.insert("titles", {itemid: itemid, itemtype: itemtype, itemname: itemname, source: source, date: date, year: year, rating: rating, path: path});
				});
				
				lib.commit();	
				doOutput(query, urlObj, options)	
			},
			error: function (request, status, error) {
				$.mobile.hidePageLoadingMsg();
				navigator.notification.alert(error, null, "gesturePad");
			}
		});
	} else {
		doOutput(query, urlObj, options)	
	}

}
function clearDB() {
	var lib = new localStorageDB(dbRev);
	
	if (lib.tableExists("titles")) {
		lib.dropTable("titles");lib.commit();
	}
	
	if( lib.isNew() || lib.tableExists("titles") == false ) {
		lib.createTable("titles", ["itemid", "itemtype", "itemname", "source", "date", "year", "rating", "path"]);
		lib.commit();
	} 
	navigator.notification.alert("Database is now cleared", null, "gesturePad");
}

function doOutput(query, urlObj, options) {
	
	var lib = new localStorageDB(dbRev);
	
	if( lib.isNew() || lib.tableExists("titles") == false ) {
		lib.createTable("titles", ["itemid", "itemtype", "itemname", "source", "date", "year", "rating", "path"]);
		lib.commit();
	}
	
	var toSearch = query.split("&Search=")[1]
	if (toSearch==undefined) {
		var toSearch = "";
	}
	toSearch = toSearch.toLowerCase();
	query = query.split("&Search=")[0];
	
	var searchbox = '<div class="sform" style="display:none"><input type="search" value="" onkeyup="var a = $(this).parent().next(); $(a).attr(\'href\', $(a).attr(\'dsearch\') + $(this).val() ); " /> <a href="#" data-theme="g" dsearch="#MB|' + query + '&Search=" data-role="button">Search</a><p>&nbsp;</p></div>'
	var btn =  '<a data-role="none" data-enhance="false" style="background-image: url(\'images/search.png\');" onclick="$(this).parent().next().find(\'div.sform\').toggle();"  class="opaqueicon"></a>'
	if (query == "get.Groups") {
		btn =  '<a data-role="none" data-enhance="false" style="background-image: url(\'images/refresh.png\');" onclick="clearDB()" class="opaqueicon"></a>'
		searchbox = '';
	}

	var pagecontainer = $('<div data-role="page" data-origQ="' + query + '" > <div data-role="header"> <a class="customclose" onclick="history.back(-1)">Back</a> <h1>&nbsp;</h1> ' + btn + ' </div> <div data-role="content"> ' + searchbox + ' <ul data-role="listview" ></ul></div></div>');
	var toAppend = $(pagecontainer).find("ul:first");
	
	var titles = lib.query("titles", null, 9999);

	titles.sort(custom_sort);
	var counter = 0;
	var output = "";
	$.each(titles, function(i, row) {
		if(row.source == query || toSearch != "") {
			var thisitem = row.itemname.toString().toLowerCase();
			if ( thisitem.indexOf(toSearch) > -1 ) {
			  	if (counter <= 100) {
			  		subcaption = '';
			  		if ( row.year != null ) {
			  			subcaption = '<p>' + row.year + ' Rated: '  + row.rating + '</p>';
			  		}

					if ( row.itemtype == "series" || row.itemtype == "season"  ) {
						output += ('<li><a href="#MB|get.Children|' + escape(row.itemid) + '"><img onerror="this.setAttribute(\'src\', \'images/default.png\')" src="' + baseURL + '/get.Image?path=' + row.path + 'folder.jpg&height=80' + '" /><h3>' + row.itemname + '</h3>' + subcaption + '</a></li>');	
					} else if ( row.itemtype == "movie" || row.itemtype == "episode"  ) { 
						output += ('<li><a href="#MB|Play" data-transition="flip" onclick="$(\'#playdialog\').attr(\'data-guid\', \'' + row.itemid + '\')"><img onerror="this.setAttribute(\'src\', \'images/default.png\')" src="' + baseURL + '/get.Image?path=' + row.path + 'folder.jpg&height=80' + '" /><h3>' + row.itemname + '</h3>' + subcaption + '</a></li>');	
					} else {
						output += ('<li><a href="#MB|get.Group?group=' + escape(row.itemid) + '"><img onerror="this.setAttribute(\'src\', \'images/default.png\')" src="' + baseURL + '/get.Image?path=' + row.path + 'folder.jpg&height=80' + '" /><h3>' + row.itemname + '</h3>' + subcaption + '</a></li>');
					}
			   }
			   counter += 1;
			}

		}
		
	});
	
	$(toAppend).html(output);
	$(pagecontainer).appendTo( $("body") );
	$(pagecontainer).page();
	options.dataUrl = urlObj.href;
	options.transition = "slide"	

	if (query == "get.Groups" && options.fromHashChange == false ) {
		options.transition = "slideup"
	}
	
	$.mobile.changePage( $(pagecontainer), options )
}




function getMetaData(itemid, options) {

	var itemtitle = '';
	var itemyear = '';
	var itemruntime = '';
	var itemrating = '';
	var itemimdb = '';
	var itemdescription = '';
	var itemposter = '';
	var itemtagline = '';
	var mediadetails = '';
	var actors = '';
	var moviedetails = '';
	var itemgenres = '';

	var pagecontainer = $('<div data-role="page" > <div data-role="header"> <a class="customclose" onclick="history.back(-1)">Back</a> <h1>Details</h1></div> <div data-role="content" style="padding: 0px"></div></div>');
	var toAppend = $(pagecontainer).find("div[data-role='content']");

	var imgwidth = Math.floor(($(window).width()*0.34));

		$.ajax({
			url: baseURL + "/get.MetaData/" + itemid,
			dataType: "xml",
			async: false,
			success:function(resp){
				
				itemtitle = $(resp).find("localtitle:first").text();
				itemyear = $(resp).find("productionyear:first").text();
				itemruntime = $(resp).find("runtime:first").text();
				itemrating = $(resp).find("rating:first").text();
				itemimdb = $(resp).find("imdbid:first").text();
				itemdescription = $(resp).find("description:first").text();
				itemtitle = $(resp).find("localtitle:first").text();
				
				$(resp).find("genre").each( function() {
					itemgenres = itemgenres + $(this).text() + "  "
				});
				itemposter = baseURL + "/get.Image?path=" + $(resp).find("posters > poster:first").text() + "&width=" + imgwidth;
				
				if ( $(resp).find("mediainfo > video, mediainfo > audio").size() > 0 ) {
					mediadetails = mediadetails + "<h3>Media Information</h3>";
					$(resp).find("mediainfo > video, mediainfo > audio").children().each(function() {
						if ($(this).text().toString() != "") {
							mediadetails = mediadetails + "<p>" + $(this)[0].nodeName.toString().toUpperCase() + "</p>"
							mediadetails = mediadetails + "<p style='padding-left: 5px;'>" + $(this).text().toString() + "</p>"
						}
					});
				}
				
				details = $(resp).find("path:first, filename:first, groupvalue:first, dateadded:first, runtime:first, mpaarating:first, mpaadescription:first, aspectratio:first, studio, country");
				if ( $(details).size() > 0 ) {
					moviedetails = moviedetails + "<h3>Movie Information</h3>";
					$(details).each(function() {
						if ($(this).text().toString() != "") {
							moviedetails = moviedetails + "<p>" + $(this)[0].nodeName.toString().toUpperCase() + "</p>"
							moviedetails = moviedetails + "<p style='padding-left: 5px;'>" + $(this).text().toString() + "</p>"
						}
					});
				}
				
				if ( $(resp).find("person").size() > 0 ) {
					actors = actors + "<h3>Cast and Crew</h3><ul data-role='listview' data-inset='true' data-theme='c'>";
					$(resp).find("person").each(function(i) {
						var CastName = $(this).find("name").text();
						var CastRole = $(this).find("role").text();
						var CastType = $(this).find("type").text();
						var CastThumb = $(this).find("thumb").text();
						if ( i < 4 ) {
							actors = actors + "<li>"
							actors = actors + "<img src='" + baseURL + "/get.Image?path=" + CastThumb + "&width=50' />"
							actors = actors + "<h3>" + CastName + "</h3>"
							actors = actors + "<p>" + CastRole + " - " + CastType + "</p>"
							actors = actors + "</li>"
						}
					});
					actors = actors + "</ul>";
				}
				
				
				newHTML = ('<div class="ui-body ui-body-a">' + 
					   			'<h1>' +itemtitle + ' (' + itemyear + ')</h1>' + 
									'<div><img src="' + itemposter + '" class="boxcover" />'+
									'<p>' +itemdescription+ '</p>'+
									itemtagline + '<p>' + itemgenres + '</p>'+ 
									'</div><div style="clear:both"></div>');
				
				newHTML = newHTML + '<div data-role="collapsible" data-theme="a" data-content-theme="a" data-collapsed="false"><h3>Play</h3> <div class="pbuttons"></div> </div>'
								
				if (moviedetails != "") {
					newHTML = newHTML + '<div data-role="collapsible" data-theme="a" data-content-theme="a" data-collapsed="false">' +
							moviedetails +
						'</div>'
				}	
				
				if (mediadetails != "") {
					newHTML = newHTML + '<div data-role="collapsible" data-theme="a" data-content-theme="a" data-collapsed="false">' +
							mediadetails +
						'</div>'
				}
			
				
				if (actors != "") {
					newHTML = newHTML + '<div data-role="collapsible" data-theme="a" data-content-theme="a" data-collapsed="false">' +
							actors +
						'</div>'
				}		
				
				
				
				newHTML = newHTML +  '<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>'
				
				$(toAppend).html(newHTML);
				
				$(xml).find("gesturePad > rooms > room").each(function() {
	
					var btn = $("<a data-role='button' data-theme='b' data-mce='" + $(this).find("device[shortname='MetaB'] > baseurl").text() + "'>" + $(this).find("name:first").text() + "</a>")
					$(btn).bind("vclick", function() {
						 $("#playdialog").attr("data-guid")
						 var u = $(this).attr("data-mce") + "playitem?value=" + $("#playdialog").attr("data-guid")
						$.ajax({
						    type: "GET",
							url: u, 
							dataType: "xml",
							success: function(resp) {
								var url = window.location.href;
								if (url.indexOf("?") > 0) {
									url = url.substring(0, url.indexOf("?"));
								}
								if (url.indexOf("#") > 0) {
									url = url.substring(0, url.indexOf("#"));
								}
								window.location.href = url;
							},
							error: function() {
								navigator.notification.alert("Error playing", null, "gesturePad");
							}		
						});
					});
					$(toAppend).find("div.pbuttons:first").append( btn );
				});
				
				$(pagecontainer).appendTo( $("body") );
				$(pagecontainer).page();
				options.dataUrl = urlObj.href;
				options.transition = "slide"	
				
				$.mobile.changePage( $(pagecontainer), options )

			}
			,
			error: function (request, status, error) {
				$.mobile.hidePageLoadingMsg();
				alert(error);
			}	
		})	

}