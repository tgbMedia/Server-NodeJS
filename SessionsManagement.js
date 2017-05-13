var Transcoder = require('./Transcoder.js');

var transcoerConfig = require('./config/transcoderConfig.json');
var liveSessions = [];

module.exports = {
	start: function(fingerPrint, res, videoFilePath, cb){
		if(typeof liveSessions[fingerPrint] !== "undefined" 
			&& liveSessions[fingerPrint].config.videoPath == videoFilePath){

			console.log('----- Start request for the same file! -----');
			liveSessions[fingerPrint].setM3u8Callback(cb);

			return;
		}

		this.killSession(fingerPrint, () => {
			//Create new transcoder
			liveSessions[fingerPrint] = new Transcoder({
				sessionId: fingerPrint,
				videoPath: videoFilePath,
				publicDir: transcoerConfig.publicDir,
				segmentTime: transcoerConfig.segmentTime,
				segmentOffset: 0,
				minPartsForStream: transcoerConfig.minPartsForStream,
				mrpas: transcoerConfig.minPartsForSeek, //MIN_READY_PARTS_AFTER_SEEK
				maxLiveParts: transcoerConfig.maxLiveParts
			});

			//Start transcoding
			liveSessions[fingerPrint].transcode(cb);

		});
	},

	seek: function(fingerPrint, filePath, cb){
		if(typeof liveSessions[fingerPrint] == "undefined")
			return;
		
		liveSessions[fingerPrint].seekToPart(
			liveSessions[fingerPrint].pathToPartIndex(filePath),
			cb
		);
	},

	killSession: function(fingerPrint, cb){
		if(typeof liveSessions[fingerPrint] !== "undefined")
			liveSessions[fingerPrint].kill(cb);
		else
			cb();		
	},

	killAll: function(cb){
		console.log("Kill all sessions");

		let promises = [];

		for(var fingerPrint in liveSessions)
		{
			promises.push(new Promise((resolve, reject) => {
				this.killSession(fingerPrint, function(){
					resolve();
				})
			}))
		}

		Promise.all(promises)
			.then(cb);
	}
};