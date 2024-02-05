var path = require('path'),
	fs = require('fs'),
	ffmpeg = require('fluent-ffmpeg'),
	chokidar = require('chokidar'),
	{ rimraf, rimrafSync} = require('rimraf'),
	movieUtils = require('./data/movieUtils.js');

//Private variables 
//var watcherResCallback = undefined;
var m3u8Callback = undefined;
var lastTranscodedPart = 0;

function Transcoder(config) {
  this.config = config;
  this.tempFilesDir = path.resolve(process.cwd(), `${this.config.publicDir}/${this.config.sessionId}`);

  this.createTempDir();
}

Transcoder.prototype.createTempDir = function(){
	//Remove if already exists
	console.log('Create temp directory ' + this.tempFilesDir);
	
	try {
		 rimrafSync(this.tempFilesDir);
		 fs.mkdirSync(this.tempFilesDir)
	} 
	catch (err) {
		if (err.code !== 'EEXIST') 
			throw err
	}
}

Transcoder.prototype.pathToPartIndex = function(filePath, validExt = '.ts'){
	if(path.extname(filePath) != validExt)
		return -1;

	let partFileName = path.basename(filePath);

	return parseInt(partFileName.split('.')[0]);
}

Transcoder.prototype.setM3u8Callback = function(cb) {
	m3u8Callback = cb;
}

Transcoder.prototype.transcode = function(cb, startTime = 0) {

	ffmpeg.ffprobe(this.config.videoPath, (err, fileMetadata) => {

		//Update callback
		m3u8Callback = cb;

		//Store metadata
		this.metadata = fileMetadata;

		//Create watcher for temp files
		this.watcher = chokidar.watch(`${this.tempFilesDir}/*.ts`);

		this.watcher.on('add', filePath => {

			//Parse file name
			let partFileName = path.basename(filePath);
			let partIndex = parseInt(partFileName.split('.')[0]) - this.config.segmentOffset;

			lastTranscodedPart = partIndex + this.config.segmentOffset;
			console.log("Last transcoded part: " + lastTranscodedPart);

			if(typeof m3u8Callback == "undefined")
				return;

			if(this.seekRequest && partIndex > this.config.mrpas){
				this.seekRequest = false;

				m3u8Callback();
				m3u8Callback = undefined;

				console.log('Seek request completed!');
			}
			else if(!this.seekRequest && partIndex > this.config.minPartsForStream)
			{
				console.log("Send m3u8...");

				m3u8Callback(movieUtils.m3u8Generate(
					this.config.sessionId, 
					this.config.segmentTime, 
					this.metadata.format.duration
				));

				m3u8Callback = undefined;
			}
		});

		//FFMPEG Parameters
		this.proc = ffmpeg(this.config.videoPath)
			.on('start', function(commandLine) {
				console.log(commandLine);
			})
			.inputOptions('-ss ' + startTime)
			.videoCodec('libx264')
			.audioBitrate('128k')
			.size('768x1024')
			.outputOptions([
				//'-bsf:v h264_mp4toannexb',
				//'-codec:v copy',
				'-codec:a libmp3lame',
				'-profile:v main',
				'-preset:v ultrafast',
				'-level 3.1',
				//'-b:a 128k',
				//'-ac 2',
				//'-strict experimental',
				'-segment_start_number ' + this.config.segmentOffset,
				//'-movflags +faststart',
				'-flags -global_header',
				'-segment_time ' + this.config.segmentTime,
				'-segment_format mpegts',
			])
			.format('segment')
			.output(`${this.tempFilesDir}/%d.ts`)
			.on('error', function(err, stdout, stderr) {
				console.log('an error happened: ' + err.message/* + stdout + stderr*/);
			})
			.on('end', function(err, stdout, stderr) {
				console.log('End!');
			});

		//Run command!
		this.proc.run();

		console.log('Transcoding, start time: ' + startTime);

	});
};

Transcoder.prototype.seekToPart = function(partIndex, cb) {
	console.log(`Seek request partIndex: ${partIndex}, lastTranscodedPart: ${lastTranscodedPart}`)

	/*if(lastTranscodedPart == partIndex || (partIndex - 5) < lastTranscodedPart){
		console.log(`Seek request: part ${partIndex} is already in progress`);
		cb();
		return;
	}*/

	fs.exists(`${this.tempFilesDir}/${partIndex}.ts`, (exists) => {
		if(exists)
		{
			console.log(`Seek request: part ${partIndex} is already exists`);
			cb();
			return;
		}
		
		if(partIndex > lastTranscodedPart && lastTranscodedPart + 5 > partIndex)
		{
			console.log(`Seek request: part ${partIndex} is already in progress`);
			cb();
			return;
		}

		this.seekRequest = true;
		console.log(`Seek request: part ${partIndex} is missing, killing current transcoder process`);

		this.kill(() => {
			this.config.segmentOffset = partIndex;
			this.createTempDir();

			this.transcode(cb, partIndex * this.config.segmentTime);
		});
		
	});
}

Transcoder.prototype.deleteTempFiles = function(cb) {
	console.log("Deleting temp files " + this.tempFilesDir);
	rimrafSync(this.tempFilesDir);
	cb()
}

Transcoder.prototype.killProc = function() {
	if(typeof this.proc === "undefined")
		return;

	this.lastAddedFile = undefined;
	this.watcher.close();
	this.proc.kill();
}

Transcoder.prototype.kill = function(cb) {
	console.log("Killing session: " + this.config.sessionId);

	this.killProc();
	this.deleteTempFiles(cb);
}

// export the class
module.exports = Transcoder;