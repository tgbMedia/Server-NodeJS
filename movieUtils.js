var dbConfig = require('./config/databaseConfig.json'),
	videoExtensions = require("./video-extensions.json"),
	globby = require('globby'),
	path = require('path'),
	tnp = require('torrent-name-parser'),
	low = require('lowdb');

const db = low(dbConfig.databasesDir + '/titleToPath.json');

db.defaults({ videos: [] })
  .write();
	
module.exports = {
	videoGlob: [`**/*.{${videoExtensions.join(',')}}`, '!**/*{sample,Sample,rarbg.com,RARBG.com}*.*'],

	titleToPath: function(title){
		return movieTitle = db.get(dbConfig.titleToPathDb.schemaName)
		  .find({ title: title })
		  .value();
	},

	moviesList: function(moviesDirectory, cb){
		globby(this.videoGlob,  {'cwd': moviesDirectory}).then(movies => {
			cb(movies.map(moviePath => {
				let movieDetails = tnp(path.basename(moviePath));

				//Push movie to the databse
				if(!this.titleToPath(movieDetails.title)){
					db.get(dbConfig.titleToPathDb.schemaName)
					  .push({ title: movieDetails.title, path: moviePath})
					  .write()

				}

				return movieDetails;
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