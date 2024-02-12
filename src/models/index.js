const path = require('path')
const dbConfig = require('../../config/dbConfig.json');
const fs = require("fs");
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(dbConfig);

// load models
const models = fs.readdirSync(path.resolve(__dirname));

models.forEach(modelName => {
	if(modelName === "index.js") {
		return;
	}

	const modelpath = path.resolve(__dirname, modelName);
	require(modelpath)(sequelize, Sequelize);
});

module.exports.sequelize = sequelize;