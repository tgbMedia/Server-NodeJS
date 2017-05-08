var express = require('express'),
	movieUtils = require('./movieUtils.js'),
	appConfig = require('./config/appConfig.json'),
	path = require('path'),
	api = require('./api.js'),
	shortid = require('shortid'),
	Transcoder = require('./Transcoder.js');

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
			segmentTime: 15,
			segmentOffset: 0,
			minPartsForStream: 30

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


