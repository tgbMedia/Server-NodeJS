var videoExtensions = require("./video-extensions.json"),
	globby = require('globby'),
	path = require('path'),
	tnp = require('torrent-name-parser');
	
module.exports = {
	DEFAULT_GLOB: [`**/*.{${videoExtensions.join(',')}}`, '!**/*{sample,Sample,rarbg.com,RARBG.com}*.*'],

	baseName: function(str){
		var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    	
    	if(base.lastIndexOf(".") != -1)       
        	base = base.substring(0, base.lastIndexOf("."));

   		return base;
	},

	title: function(filePath){
		var fileName = path.basename(filePath).replace(/\.(avi|mkv|mpeg|mpg|mov|mp4|m4v)/i, '');
		var movie = fileName.match(/(.*?)(directors(.?)cut|480p|720p|1080p|dvdrip|xvid|cd[0-9]|bluray|dvdscr|brrip|divx|S[0-9]{1,3}E[0-9]{1,3}|Season[\s,0-9]{1,4}|[\{\(\[]?[0-9]{4}).*/i);

		return movie && movie[1] ? movie[1].replace(/\./g, ' ').trim() : fileName;
	},

	moviesList: function(path, cb){
		globby(this.DEFAULT_GLOB,  {'cwd': path}).then(movies => {
			cb(movies.map(tnp));
		});
	}
}