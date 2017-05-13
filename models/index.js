var path = require('path'),
	Sequelize = require('Sequelize'),
	dbConfig = require('../config/dbConfig.json');

var sequelize = new Sequelize(dbConfig);

// load models
var models = [
	'Movie'
];

models.forEach(modelName => {
	module.exports[modelName] = sequelize.import(path.resolve(__dirname, modelName));
});

module.exports.sequelize = sequelize;



