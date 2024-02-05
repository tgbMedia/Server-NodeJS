var videoExtensions = require("../../config/video-extensions.json"),
	{ glob} = require("glob"),
	path = require('path'),
	tnp = require('torrent-name-parser');
const {raw} = require("express");
	
module.exports = {
	allVideoFiles: function(path){
		return new Promise((resolve, reject) => {
			glob(`**/*.{${videoExtensions.join(',')}}`, {
				cwd: path
			}).then((res) => {
				resolve(res);
			})
		})

	},

	addVideo: function(filePath, model){
		return new Promise(function(resolve, reject){
			let parseName = tnp(path.basename(filePath));			

			model.create({
				title: parseName.title,
				 year: parseName.year,
				 path: filePath
			})
			.then(function(movie){
				return resolve(movie);
			})
			.catch(err => {
				return reject(err);
			})
		})
	},

	refreshVideosList: async function(moviesPath, model){
		await model.sync({force: true});
		const movies = await this.allVideoFiles(path.join(process.cwd(), moviesPath));

		let result = [];
		for (const movie of movies) {
			result.push(await this.addVideo(movie, model));
		}

		return this.videosListResponse(result);
	},

	videosListResponse: function(movies){
		return movies.map((video) => {
			return {
				id: video.id,
				title: video.title,
				year: video.year
			}
		})
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