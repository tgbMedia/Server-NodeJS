var express = require('express'),
	movieUtils = require('./movieUtils.js'),
	appConfig = require('./config/appConfig.json'),
	ffmpeg = require('fluent-ffmpeg'),
	path = require('path'),
	fs = require('fs'),
	api = require('./api.js');

var app = express();
app.use(express.static(__dirname + '/flowplayer'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});


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
		//res.contentType('flv');

		const size = metadata.format.size;
		const start = 0;
		const end = size - 1;
		const chunkSize = (end - start) + 1;

		res.set({
	       'Content-Range': `bytes ${start}-${end}/${size}`,
	       'Accept-Ranges': 'bytes',
	       'Content-Length': chunkSize,
	       'Content-Type': 'video/mp4',
	     });
	     // É importante usar status 206 - Partial Content para o streaming funcionar
	     res.status(206);

		var pathToMovie = path.resolve(appConfig.moviesDir, videoPath.path);
		
console.log(metadata.format.duration);

		var proc = ffmpeg(pathToMovie)
			.format('mp4')
			.outputOptions('-frag_duration 150000')
			.outputOptions('-g 250')
		    .videoCodec('libx264')
		    .audioCodec('aac')
			.on('end', function() {
				console.log('file has been converted succesfully');
			})
			.on('error', function(err) {
				console.log('an error happened: ' + err.message);
			})			
			.pipe(res, {end:true});

	  	console.log();
	});

	/*movieFile = path.resolve(appConfig.moviesDir, videoPath.path);

	fs.stat(movieFile, (err, stats) => {
     if (err) {
       console.log(err);
       return res.status(404).end('<h1>Movie Not found</h1>');
     }
     // Variáveis necessárias para montar o chunk header corretamente
     const { range } = req.headers;
     const { size } = stats;
     const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
     const end = size - 1;
     const chunkSize = (end - start) + 1;
     // Definindo headers de chunk
     res.set({
       'Content-Range': `bytes ${start}-${end}/${size}`,
       'Accept-Ranges': 'bytes',
       'Content-Length': chunkSize,
       'Content-Type': 'video/mp4'
     });
     // É importante usar status 206 - Partial Content para o streaming funcionar
     res.status(206);
     // Utilizando ReadStream do Node.js
     // Ele vai ler um arquivo e enviá-lo em partes via stream.pipe()
     const stream = fs.createReadStream(movieFile, { start, end });
     stream.on('open', () => stream.pipe(res));
     stream.on('error', (streamErr) => res.end(streamErr));
   });*/
});

app.listen(appConfig.serverPort, function () {
  console.log("Running!")
});

