
	/*var channels = null;

	self.addEventListener('message', function(e) {
		channels = e.data.channels;
		var baseURL = e.data.baseURL;

		for (var key = 0; key < channels.length; key++) {

			if (key > 0) {
				break;
			}
			if ( channels[key].ending < (new Date).getTime() ) {

				
				//downloadFile(baseURL + 'tv/getProgInfo?major=' + channels[key].number)
	importScripts(baseURL + 'tv/getProgInfo?major=' + channels[key].number);



				xmlHttpRequest = new XMLHttpRequest();
	           	var test = "bar";
				req = new XMLHttpRequest();

				//req.open("GET", baseURL + 'tv/getProgInfo?major=' + channels[key].number, true);
				req.open("GET", 'spec.html', true);
				req.onreadystatechange = function(key) { return function() {

				        if (this.readyState != 4)
				        	
				            return;
				        if (this.status == 200) {
							self.postMessage("ar");
				        	var guide = eval('('+ xmlHttpRequest.responseText +')');
				        	channels[key].nowplaying =  guide.title;
				        	channels[key].ending = (guide.startTime+guide.duration);
				        	channels[key].timeleft  (  hms2( (guide.startTime+guide.duration) - Math.floor(new Date().getTime() / 1000)  ) ) 
				        	var retVal = new Object();
				        	retVal.key = key;
				        	retVal.channel = channels[key];
				        	//self.postMessage(retVal);
				        };
				    }(test);
				}
				req.send(null);

			}	
		}
		
	}, false);*/



	function hms2(totalSec) {
		if (totalSec < 0 ) {
			return "0:00"
		}
	    hours = parseInt( totalSec / 3600 ) % 24;
	    minutes = parseInt( totalSec / 60 ) % 60;
	    seconds = totalSec % 60;
	    return (hours < 10 ? "0" + hours : hours)  + ":" + (minutes < 10 ? "0" + minutes : minutes) ;
	}


self.addEventListener('message', function (e) {
    var data = e.data;
    var url = "file:///Users/Jed/Library/Application%20Support/iPhone%20Simulator/6.0/Applications/99F7648B-36BB-46C4-9DE9-0DD82DF7639E/gesturePad.app/www/test.html";
    GetData(url);
}, true);

function GetData(url) {

    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    postMessage(xhr.responseText);
                }
            }
        };
        xhr.send(null);
    } catch (e) {
        postMessage(e.message);
    }
}
