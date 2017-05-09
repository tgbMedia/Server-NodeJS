var path = require('path'),
	fs = require('fs'),
	ffmpeg = require('fluent-ffmpeg'),
	chokidar = require('chokidar'),
	rimraf = require('rimraf'),
	movieUtils = require('./movieUtils.js');

var m3u8IsAlreadySent = false;
var watcherResCallback = undefined;
var lastSeekPart = 0;

const MRPAS = 5; //MIN_READY_PARTS_AFTER_SEEK

// Constructor
function Transcoder(config) {
  this.config = config;
  this.tempFilesDir = path.resolve(__dirname, `${this.config.publicDir}/${this.config.sessionId}`);

  this.createTempDir();
}

Transcoder.prototype.createTempDir = function(){
	//Remove if already exists
	console.log('Create temp directory ' + this.tempFilesDir);

	try {
		rimraf(this.tempFilesDir, () =>{ 
			fs.mkdirSync(this.tempFilesDir);
		});
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

Transcoder.prototype.transcode = function(cb, startTime = 0) {
	watcherResCallback = cb;
	this.lastStartTime = startTime;

	ffmpeg.ffprobe(this.config.videoPath, (err, fileMetadata) => {

		//Store metadata
		this.metadata = fileMetadata;

		//Create watcher for temp files
		this.watcher = chokidar.watch(`${this.tempFilesDir}/*.ts`);

		this.watcher.on('add', filePath => {

			if(typeof watcherResCallback == "undefined")
				return;

			//Parse file name
			let partFileName = path.basename(filePath);
			let partIndex = parseInt(partFileName.split('.')[0]) - this.config.segmentOffset;

			console.log("Part index: " + partIndex);
			lastSeekPart = partIndex;

			if(this.seekRequest && partIndex > MRPAS){
				this.seekRequest = false;

				watcherResCallback();
				watcherResCallback = undefined;

				console.log('Seek request completed!');
			}
			else if(!this.seekRequest && partIndex > this.config.minPartsForStream)
			{
				console.log("Send m3u8...");

				watcherResCallback(movieUtils.m3u8Generate(
					this.config.sessionId, 
					this.config.segmentTime, 
					this.metadata.format.duration
				));

				watcherResCallback = undefined;
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
			.size('45%')
			.outputOptions([
				//'-bsf:v h264_mp4toannexb',
				//'-codec:v copy',
				'-codec:a libmp3lame',
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
				//console.log('an error happened: ' + err.message + stdout + stderr);
				//console.log('Delete ' + path.resolve(__dirname, tempFilesDir));
				//rimraf(path.resolve(__dirname, tempFilesDir), function () { console.log('done'); });
			})
			.on('end', function(err, stdout, stderr) {
				console.log('End!');
				//res.end();
			});

		//Run command!
		this.proc.run();

		console.log('Trancode start time: ' + startTime)

	});
};

Transcoder.prototype.seekToPart = function(partIndex, cb) {
	console.log(`Seek request partIndex: ${partIndex}, lastSeekPart = ${lastSeekPart}`)

	if(lastSeekPart == partIndex || (partIndex - 3) < lastSeekPart){
		console.log("Seek request: Already working...");
		cb();
		return;
	}

	fs.exists(`${this.tempFilesDir}/${partIndex}.ts`, (exists) => {
		if(exists)
		{
			console.log('Part ' + partIndex + ' is already exists');
			cb();
			return;
		}

		this.seekRequest = true;
		console.log('Part ' + partIndex + ' is missing!');

		this.kill(() => {
			this.config.segmentOffset = partIndex;
			this.createTempDir();

			this.transcode(cb, partIndex * this.config.segmentTime);
		});
		
	});
}

Transcoder.prototype.deleteTempFiles = function(cb) {
	rimraf(this.tempFilesDir, cb);
}

Transcoder.prototype.killProc = function() {
	if(typeof this.proc === "undefined")
		return;

	this.lastAddedFile = undefined;
	this.watcher.close();
	this.proc.kill();
}

Transcoder.prototype.kill = function(cb) {
	this.killProc();
	this.deleteTempFiles(cb);
}

// export the class
module.exports = Transcoder;