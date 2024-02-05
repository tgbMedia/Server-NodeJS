var config = require('../config/apiConfig.json');

module.exports = {
	response: function(res, success, error, results){
		res.send(JSON.stringify({
			[config.requestStatusKey]: success ? config.successStatus : config.failedStatus,
			[config.errorKey]: error,
			[config.resultsKey]: results,
		}));
	},
	error: function(res, message, statusCode){
		res.status(statusCode);
		res.send(message);
	}
}