var videoExtensions = require("./video-extensions.json"),
	glob = require("glob"),
	path = require('path'),
	tnp = require('torrent-name-parser');
	
module.exports = {
	allVideoFiles: function(path, cb){
		glob(`**/*.{${videoExtensions.join(',')}}`, {
			cwd: path
		}, cb);
	},

	addVideo: function(filePath, model){
		return new Promise(function(resolve, reject){
			let parseName = tnp(path.basename(filePath));			

			model.findOrCreate({
				where: {path: filePath},
				defaults: {title: parseName.title, year: parseName.year}
			})
			.spread(function(movie, created){
				return resolve(movie);
			})
			.catch(err => {
				return reject(err);
			})
		})
	},

	refreshVideosList: function(path, model){
		return new Promise((resolve, reject) => {
			this.allVideoFiles(path, (err, files) => {
				if(err){
					return reject(err);
				}

				let promises = files.map(file => {
					return this.addVideo(file, model);
				})

				Promise.all(promises)
					.then(results => {
						return resolve(this.videosListResponse(results));
					});
			})
		});
	},

	videosListResponse: function(movies){
		return new Promise(function(resolve, reject){
			return resolve(movies.map(video => {
				return {
					id: video.id,
					title: video.title,
					year: video.year
				}
			}));
		});
	},

	m3u8Generate(dirPath, segmentTime, videoDuration){
		let content = "#EXTM3U\n"
			+ "#EXT-X-VERSION:3\n"
			+ "#EXT-X-MEDIA-SEQUENCE:0\n"
			+ "#EXT-X-ALLOW-CACHE:YES\n"
			+ "#EXT-X-TARGETDURATION:15\n";

		let totalSegments = videoDuration / segmentTime;

		for(let i = 0; i < totalSegments; i++){
			content += `#EXTINF:${segmentTime},\n`
				+ `/static/${dirPath}/${i}.ts\n`;
		}

		content += "#EXT-X-ENDLIST";
		return content;
	}

}