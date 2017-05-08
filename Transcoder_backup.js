var path = require('path'),
	fs = require('fs'),
	ffmpeg = require('fluent-ffmpeg'),
	chokidar = require('chokidar'),
	rimraf = require('rimraf');

var proc = undefined;
var m3u8IsAlreadySent = false;
var lastAddedFile = undefined;
var watcherResCallback = undefined;

// Constructor
function Transcoder(config) {
  this.config = config;
  this.tempFilesDir = path.resolve(__dirname, `${this.config.publicDir}/${this.config.sessionId}`);

  this.createTempDir();
}

Transcoder.prototype.watcher = function(filePath){
	console.log(filePath);
	/*if(typeof lastAddedFile !== "undefined"){
		console.log(lastAddedFile + " => " + lastAddedFile.split('.')[0] + '.ts')
	}

	lastAddedFile = filePath;

	if(typeof watcherResCallback !== "undefined" && ++totalTempFiles > this.config.minPartsForStream)
	{
		console.log("Send m3u8...");
		return movieUtils.m3u8Generate(sessionId, 5, metadata.format.duration);
	}*/
}

Transcoder.prototype.createTempDir = function(){
	//Remove if already exists
	console.log('Create temp directory ' + this.tempFilesDir);
	fs.mkdirSync(this.tempFilesDir);
}

Transcoder.prototype.tmpFileRename = function(filePath){
	fs.rename(filePath, filePath.split('.')[0] + '.ts');
}

Transcoder.prototype.transcode = function(cb) {
	this.watcherResCallback = cb;

	console.log(this.config);

	ffmpeg.ffprobe(this.config.videoPath, function(err, metadata) {
		//Create watcher for temp files
		console.log("DONE!");
		return;

		const watcher = chokidar.watch(`${this.tempFilesDir}/*.tmp`);
		watcher.on('add', Transcoder.prototype.watcher);

		this.proc = ffmpeg(this.config.videoPath)
			.on('start', function(commandLine) {
				console.log(commandLine);
			})
			.outputOptions([
				'-bsf:v h264_mp4toannexb',
				'-c copy',
				'-map 0',
				'-flags -global_header',
				'-segment_time ' + this.config.segmentTime,
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

		this.proc.run();

	});
};

// export the class
module.exports = Transcoder;