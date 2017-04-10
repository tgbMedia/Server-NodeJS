var config = require('./config/apiConfig.json');

module.exports = {
	response: function(res, success, error, results){
		res.end(JSON.stringify({
			[config.requestStatusKey]: success ? config.successStatus : config.failedStatus,
			[config.errorKey]: error,
			[config.resultsKey]: results,
		}));
	}
}