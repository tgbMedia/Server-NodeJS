var express = require('express'),
	sessions = require('../SessionsManagement.js'),
	movieUtils = require('../movieUtils.js'),
	api = require('../api.js');

var router  = express.Router();

router.get('/movies_list', function(req, res) {

	console.log(JSON.stringify(req.fingerprint));

	req.app.get('models').Movie
		.findAll()
		.then((movies) => {
			if(movies.length > 0)
				return movieUtils.videosListResponse(movies);
			else
				return movieUtils.refreshVideosList(
					req.app.get('config').moviesDir, 
					req.app.get('models').Movie
				);
		})
		.then(result => {
			api.response(res, true, "", result)
		})
		.catch(err => {
			console.log(err);
		});
});

module.exports = router;