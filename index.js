//External libraries
var express = require('express'),
	path = require('path'),
	Fingerprint = require('express-fingerprint');

//Local libraries
var sessions = require('./SessionsManagement.js');

//Initialize
var proc = undefined;
var app = express();

app.set('config', require('./config/appConfig.json'));
app.set('models', require('./models'));

//Routes 
app.get('models').sequelize
	.sync()
	.then(function(){
		app.listen(app.get('config').serverPort, function () {
			console.log("Running!")
		});
	});

//Routs
var routes = require('./routes/index');
var stream = require('./routes/stream');

app.use(Fingerprint());
app.use('/', routes);
app.use('/stream', stream);

//Close running processes 
process.on('SIGINT', function() {
	console.log("Shutting down...");

	sessions.killAll(() => {
		console.log("Good byecls");
		process.exit();
	});
});

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