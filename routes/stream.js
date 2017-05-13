var express = require('express'),
	path = require('path'),
	sessions = require('../SessionsManagement.js'),
	movieUtils = require('../movieUtils.js'),
	api = require('../api.js');

//Initialize
var router  = express.Router();

router.get('/video/:id.m3u8', function(req, res) {

	req.app.get('models').Movie
		.find({where: {id: req.params.id}})
		.then(function(movie){
			if(!movie)
				return api.error(res, `${req.params.id} Does not exists`, 404);
			
			console.log("m3u8 request: " + movie.title);

			sessions.start(
				req.fingerprint.hash, 
				res,
				path.resolve(req.app.get('config').moviesDir, movie.path), 
				function(m3u8Content){
					res.send(m3u8Content);
				}
			);

		})
		.catch(err => {
			console.log(err);
		});
});

router.get('/killLastProcess', function(req, res) {

	console.log("Kill request: " + req.fingerprint.hash);

	sessions.killSession(req.fingerprint.hash, function(){
		console.log(`Transcoder(${req.fingerprint.hash}) is killed`);
		api.response(res, true, "", []);
	});
});

module.exports = router;