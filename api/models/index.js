module.exports = (function() {
    'use strict';

    var fs        = require('fs'),
        path      = require('path'),
        Sequelize = require('sequelize'),
        lodash    = require('lodash'),
        config    = require('../config/config.json')["default"].mysql,
        merge     = require('merge'),
        db        = {};

    try {
        var configProd = require('../config/configProd.json')["production"].mysql;
        config = merge(config, configProd);
    } catch (e) {
        console.log(e);
    }


    var sequelize = new Sequelize(config.database, config.username, config.password, config);

    fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

    Object.keys(db).forEach(function(modelName) {
        if ('associate' in db[modelName]) {
            db[modelName].associate(db);
        }
    });

    sequelize.sync();

    return lodash.extend({
        sequelize: sequelize,
        Sequelize: Sequelize
    }, db);
}());