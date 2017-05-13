"use strict";

module.exports = function(sequelize, Sequelize) {
	var Movie = sequelize.define("movies", {
		id: {
			type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4,
			primaryKey: true
		},
		title: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true,
		},
		year: {
			type: Sequelize.INTEGER
		},
		path: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		}
	});

	return Movie;
};