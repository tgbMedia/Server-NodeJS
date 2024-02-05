var express = require('express'),
	sessions = require('../SessionsManagement.js'),
	api = require('../api.js');

var router  = express.Router();

router.get('/movies_list', async function(req, res) {
	console.log(JSON.stringify(req.fingerprint));

	const result = await req.app.get('models').getMoviesList(req);

	api.response(res, true, "", result);
});

module.exports = router;