var cache = {
	deleteCache: function() {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
			var directoryReader = fileSystem.root.createReader();
			directoryReader.readEntries(function(entries) {
				for (i = 0; i < entries.length; i++) {
					//entries[i].remove(function() {}, function(x) {});
					entries[i].remove(null, null);
				}
			}, function() {});
		}, function fail(evt) {
			console.log("Pull cache Error, no access to file system");
			callback({
				cached: false,
				url: request.url
			});
		});
	},
	getImageFromCache: function(request, callback) {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
			fileSystem.root.getFile(request.id + '.cache', {
				create: false,
				exclusive: false
			}, function gotFileEntry(fileEntry) {
				fileEntry.file(function readDataUrl(file) {
					var reader = new FileReader();
					reader.onloadend = function(evt) {
						callback({
							cached: true,
							url: evt.target.result.toString()
						});
					};
					reader.readAsText(file);
				}, function fail(evt) {
					console.log("Error reading Cached File");
					callback({
						cached: false,
						url: request.url
					});
				});
			}, function fail(evt) { /* console.log("Cached file doesnt exist"); */
				callback({
					cached: false,
					url: request.url
				});
			});
		}, function fail(evt) {
			console.log("Pull cache Error, no access to file system");
			callback({
				cached: false,
				url: request.url
			});
		});
	},
	saveImageToCache: function(request) {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
			fileSystem.root.getFile(request.id + '.cache', {
				create: true,
				exclusive: false
			}, function gotFileEntry(fileEntry) {
				fileEntry.createWriter(function gotFileWriter(writer) {
					writer.onwriteend = function(evt) {
						//console.log("Saved to cache: " + request.id)
					};
					writer.write(getBase64Image(request.img));
				}, function fail(evt) {
					console.log("Write to Cache Error");
				});
			}, function fail(evt) {
				console.log("Error initiating cached file");
			});
		}, function fail(evt) {
			console.log("Save cache Error, no access to file system");
		});
	},
	getBase64Image: function(img) {
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		var dataURL = canvas.toDataURL("image/png");
		return dataURL;
	},
	getJsonFromCache: function(MBUrl, callback) {
		var id = MBUrl.replace("http://", "");
		id = id.substring(id.indexOf("/") + 1);
		id = id.replace(/\//g, "-");
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
			fileSystem.root.getFile(id + '.json', {
				create: false,
				exclusive: false
			}, function gotFileEntry(fileEntry) {
				fileEntry.file(function readDataUrl(file) {
					var reader = new FileReader();
					reader.onloadend = function(evt) {
						callback(jQuery.parseJSON(evt.target.result.toString()));
					};
					reader.readAsText(file);
				}, function fail(evt) {
					console.log("Error reading Cached File");
					callback(null);
				});
			}, function fail(evt) { /* console.log("Cached file doesnt exist");  */
				callback(null);
			});
		}, function fail(evt) {
			console.log("Pull cache Error, no access to file system");
			callback(null);
		});
	},
	saveJsonToCache: function(MBUrl, d) {
		if (d === null) {
			return;
		}
		var id = MBUrl.replace("http://", "");
		id = id.substring(id.indexOf("/") + 1);
		id = id.replace(/\//g, "-");
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function gotFS(fileSystem) {
			fileSystem.root.getFile(id + '.json', {
				create: true,
				exclusive: false,
				append: false
			}, function gotFileEntry(fileEntry) {
				fileEntry.createWriter(function gotFileWriter(writer) {
					writer.onwriteend = function(evt) {
						console.log("Saved to cache: " + id);
					};
					writer.write(JSON.stringify(d));
				}, function fail(evt) {
					console.log("Write to Cache Error");
				});
			}, function fail(evt) {
				console.log("Error initiating cached json file");
			});
		}, function fail(evt) {
			console.log("Save cache Error, no access to file system");
		});
	}
};