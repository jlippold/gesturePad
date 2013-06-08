self.addEventListener('message', function(e) {

	if (e.message == "processJSON") {
		var d = e.JSON;
		var geniusResults = e.geniusResults;
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
		}
		self.postMessage('WORKER STARTED: ' + data.msg);
	}

}, false);