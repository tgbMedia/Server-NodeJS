const { sequelize } = require("../models/index")
const movieUtils = require("./movieUtils");
const api = require("../api");
const path = require("path");

class DataLayer {
    constructor(
        database,
        movieUtils,
    ) {
        this.db = database;
        this.movieModel = this.db.model("Movies");
        this.movieUtils = movieUtils;
        this.isInit = false;

        if(!this.movieModel) {
            throw new Error("Movies model in not declare");
        }

    }

     async init(cb) {
        await this.db.sync();

        this.isInit = true;
        cb();
    }

    isDbInit() {
        if (!this.isInit) {
            throw new Error("Can not get access to 'DataLayer' before initialization");
        }
    }

    async getMoviesList(req) {
        const movieList = await this.#getMovieList();

        let response;
        if(movieList.length > 0) {
            response = await this.movieUtils.videosListResponse(movieList);

        } else {
            response = await movieUtils.refreshVideosList(
                req.app.get('config').moviesDir,
                this.movieModel
            );
        }

        return response;
    }
    async #getMovieList() {
        this.isDbInit();

        return await this.movieModel.findAll();
    }

    async getMovie(id) {
        this.isDbInit();

        return await this.movieModel.findByPk(id);
    }
}

module.exports = new DataLayer(sequelize, movieUtils);