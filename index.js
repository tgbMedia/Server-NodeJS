var express = require('express'),
	movieUtils = require('./movieUtils.js'),
	appConfig = require('./config/appConfig.json'),
	ffmpeg = require('fluent-ffmpeg'),
	path = require('path'),
	api = require('./api.js');

var app = express();

app.get('/movies_list', (req, res) => {
	movieUtils.moviesList(
		appConfig.moviesDir, 
		result => api.response(res, true, "", result)
	);
});

app.get('/video/:title', function(req, res) {

	//Get movie path from the local database 
	let videoPath = movieUtils.titleToPath(req.params.title);

	if(!videoPath) //Movie title does not exists in the database
		return api.response(res, false, "Movie does not exists", null);

	ffmpeg.ffprobe(path.resolve(appConfig.moviesDir, videoPath.path),function(err, metadata) {
		//Stream it!
		res.contentType('flv');

		var pathToMovie = path.resolve(appConfig.moviesDir, videoPath.path);

		var proc = ffmpeg(pathToMovie)
			.format('flv')
		    //.flvmeta()
		    //.size('1:1')
		    //.videoBitrate('1024k')
		    .videoCodec('libx264')
		    //.fps(24)
		    //.audioBitrate('96k')
		    .audioCodec('aac')
		    //.audioFrequency(22050)
		    //.audioChannels(2)
			.on('end', function() {
				console.log('file has been converted succesfully');
			})
			.on('error', function(err) {
				console.log('an error happened: ' + err.message);
			})
			.pipe(res, {end:true});

	  	console.log();
	});
});

app.listen(appConfig.serverPort, function () {
  console.log("Running!")
});

