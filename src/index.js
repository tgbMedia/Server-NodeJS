//External libraries
const express = require('express');
const path = require('path');
const Fingerprint  = require('express-fingerprint');

//Local libraries
const sessions = require('./SessionsManagement.js');
const dataLayer = require("./data/DataLayer");

// const proc = undefined;
const app = express();

app.set('config', require('../config/appConfig.json'));
app.set('models', dataLayer);

//Routs
const routes = require('./routes');
const stream = require('./routes/stream');

app.use(Fingerprint());
app.use('/', routes);
app.use('/stream', stream);


app.use('/static', function(req, res, next) {

	if(path.extname(req.originalUrl) == '.ts'){
		//Seek request
		sessions.seek(req.fingerprint.hash, req.originalUrl, function(){
			next();
		});
	}
	else
		next();

}, express.static('public'));

//Init
app.get('models')
	.init(() => {
			app.listen(app.get('config').serverPort, function () {
			console.log("Running!")
		})
	});

//Close running processes
process.on('SIGINT', function() {
	console.log("Shutting down...");

	sessions.killAll(() => {
		console.log("Good byecls");
		process.exit();
	});
});