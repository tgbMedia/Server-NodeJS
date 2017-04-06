var videoExtensions = require("./video-extensions.json"),
	globby = require('globby'),
	path = require('path'),
	tnp = require('torrent-name-parser');
	
module.exports = {
	DEFAULT_GLOB: [`**/*.{${videoExtensions.join(',')}}`, '!**/*{sample,Sample,rarbg.com,RARBG.com}*.*'],

	moviesList: function(path, cb){
		globby(this.DEFAULT_GLOB,  {'cwd': path}).then(movies => {
			cb(movies.map(tnp));
		});
	}
}