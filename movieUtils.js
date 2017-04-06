var globby = require('globby'),
	path = require('path'),
	tnp = require('torrent-name-parser');
	
module.exports = {
	moviesList: function(path, cb){
		globby(this.DEFAULT_GLOB,  {'cwd': path}).then(movies => {
			cb(movies.map(tnp));
		});
	}
}