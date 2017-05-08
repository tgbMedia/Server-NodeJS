"use strict";

var express = require('express'),
	movieUtils = require('./movieUtils.js'),
	appConfig = require('./config/appConfig.json'),
	ffmpeg = require('fluent-ffmpeg'),
	path = require('path'),
	fs = require('fs'),
	api = require('./api.js'),
	shortid = require('shortid'),
	rimraf = require('rimraf'),
	Transcoder = require('./Transcoder.js');

/*let proc = new Transcoder({
	sessionId: shortid.generate(),
	videoPath: path.resolve(appConfig.moviesDir, movieUtils.titleToPath('Deadpool').path),
	publicDir: 'public',
	segmentTime: 5,
	segmentOffset: 3,
	minPartsForStream: 50

});*/

//proc.transcode();

//process.exit();

var app = express();
var lastProcess = undefined;
var lastAddedFile = undefined;

//-c:v libx264 -preset fast -c:a libmp3lame -b:a 128k
/*ffmpeg
 -i <Source>
 -y
 -bsf:v h264_mp4toannexb
 -c copy
 -map 0
 -flags
 -global_header
 -segment_time 5
 -segment_format mpegts
 -f segment <Output>*/

app.use(express.static(__dirname + '/flowplayer'));

app.get('/movies_list', (req, res) => {
	movieUtils.moviesList(
		appConfig.moviesDir, 
		result => api.response(res, true, "", result)
	);
});

//app.use('/static', express.static('public'))

app.use('/static', function(req, res, next) {
    console.log(path.extname(req.originalUrl));
    //res.sendFile('public/' + req.originalUrl.replace("/static/", ))

    next();
}, express.static('public'));

app.get('/video/:title.m3u8', function(req, res) {

	//TODO: Make it better! :(
	
	//Kill last process
	if(typeof lastProcess !== "undefined")
	{
		lastProcess.kill();
		console.log("Kill last process");
	}

	//Create new session
	const sessionId = shortid.generate();
	const tempFilesDir = `public/${sessionId}`;

	try {
		rimraf(
			path.resolve(__dirname, tempFilesDir), 
			function (){ 
				fs.mkdirSync(`public/${sessionId}`);
			});

		
	} 
	catch (err) {
		if (err.code !== 'EEXIST') 
			throw err
	}

	//Get movie path from the local database 
	let videoPath = movieUtils.titleToPath(req.params.title);

	if(!videoPath) //Movie title does not exists in the database
		return api.response(res, false, "Movie does not exists", null);
	
	const pathToMovie = path.resolve(appConfig.moviesDir, videoPath.path);

	ffmpeg.ffprobe(pathToMovie, function(err, metadata) {
		//Stream it!

		//Create directory watcher
		var chokidar = require('chokidar');
		const watcher = chokidar.watch(`public/${sessionId}/*.tmp`);

		var totalTempFiles = 0;

		watcher.on('add', function(filePath) { 
			
			if(typeof lastAddedFile !== "undefined"){
				console.log(lastAddedFile + " => " + lastAddedFile.split('.')[0] + '.ts')
				
				fs.rename(lastAddedFile, lastAddedFile.split('.')[0] + '.ts');
			}

			console.log(lastAddedFile);

			lastAddedFile = filePath;

			if(++totalTempFiles > 50)
			{
				console.log('Ready!');
				res.send(movieUtils.m3u8Generate(sessionId, 5, metadata.format.duration));
				watcher.close();
			}
		})

		const contentType = 'video/mp4';
		const length = metadata.format.size;

		lastProcess = ffmpeg(pathToMovie)
			.on('start', function(commandLine) {
				console.log(commandLine);
				//process.exit()
			})
			.outputOptions([
				'-bsf:v h264_mp4toannexb',
				'-c copy',
				'-map 0',
				'-flags -global_header',
				'-segment_time 5',
				'-segment_format mpegts'
				//'-ss 1500',
			])
			.format('segment')
			.output(`${tempFilesDir}/%d.tmp`)
			.on('error', function(err, stdout, stderr) {
				console.log('an error happened: ' + err.message + stdout + stderr);
				console.log('Delete ' + path.resolve(__dirname, tempFilesDir));
				rimraf(path.resolve(__dirname, tempFilesDir), function () { console.log('done'); });
			})
			.on('end', function(err, stdout, stderr) {
				console.log('End!');
				//res.end();
			});

		lastProcess.run();

	});

});

app.get('/kilLastProcess', (req, res) => {
	//Kill last process
	console.log('kilLastProcess request');

	if(typeof lastProcess !== "undefined")
	{
		api.response(res, true, "", [])

		lastProcess.kill();
		console.log("Kill last process");
	}
	else
		api.response(res, false, "", [])

});

app.listen(appConfig.serverPort, function () {
  console.log("Running!")
});

