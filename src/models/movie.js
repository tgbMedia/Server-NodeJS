"use strict";

module.exports = function(sequelize, Sequelize) {
	return sequelize.define("Movies", {
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
};