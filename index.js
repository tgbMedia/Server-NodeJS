var express = require('express'),
	movieUtils = require('./movieUtils.js'),
	appConfig = require('./config/appConfig.json');

var app = express();

app.get('/movies_list', (req, res) => {
	movieUtils.moviesList(
		appConfig.moviesDir, 
		result => res.end(JSON.stringify(result))
	);
});

app.listen(appConfig.serverPort, function () {
  console.log("Running!")
});
