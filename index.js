var express = require('express'),
	movieUtils = require('./movieUtils.js'),
	appConfig = require('./config/appConfig.json'),
	path = require('path'),
	api = require('./api.js'),
	shortid = require('shortid'),
	Transcoder = require('./Transcoder.js');

/*
ffmpeg -ss 0 -i D:\PlexServer\Movies\Doctor.Strange.2016.1080p.BluRay.x264-SPARKS\Doctor.Strange.2016.1080p.BluRay.x264-SPARKS.mkv -y -bsf:v h264_mp4toannexb -codec:v copy -codec:a copy -strict experimental -map 0 -flags -global_header -segment_time 15 -segment_format mpegts -f segment g:\work\TGB_MEDIA_SERVER\public\HkhylrR1Z/%d.tmp
*/

var proc = undefined;
var app = express();

function killLastProcess(cb){
	//Kill last process
	if(typeof proc !== "undefined")
		proc.kill(cb);
	else
		cb();
}

app.use('/static', function(req, res, next) {
    if(typeof proc !== "undefined" && path.extname(req.originalUrl) == '.ts'){
    	//Seek request
    	console.log(req.originalUrl + ' Part index: ' +  proc.pathToPartIndex(req.originalUrl));
    	proc.seekToPart(proc.pathToPartIndex(req.originalUrl), function(){
    		next();
    	});
    }
    else
    	next();

}, express.static('public'));

app.get('/movies_list', (req, res) => {
	movieUtils.moviesList(
		appConfig.moviesDir, 
		result => api.response(res, true, "", result)
	);
});


app.get('/video/:title.m3u8', function(req, res) {
	console.log(req.params.title + ".m3u8")

	killLastProcess(() => {
		proc = new Transcoder({
			sessionId: shortid.generate(),
			videoPath: path.resolve(appConfig.moviesDir, movieUtils.titleToPath(req.params.title).path),
			publicDir: 'public',
			segmentTime: 5,
			segmentOffset: 0,
			minPartsForStream: 2

		});

		proc.transcode(function(m3u8Content){
			res.send(m3u8Content);
		});
	});
});

app.get('/killLastProcess', (req, res) => {
	//Kill last process
	console.log('killLastProcess request');

	killLastProcess(() => {
		console.log("Last process is killed :)");
		api.response(res, true, "", []);
	});

});

app.listen(appConfig.serverPort, function () {
  console.log("Running!")
});


