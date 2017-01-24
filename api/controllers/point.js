module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        fs = require('fs'),
        Point = db.Point,
        availableFields = {
            'title': 'title',
            'description': 'description',
            'tags': 'tags'
        },
        hostName = require('../config/config.json')["default"].hostName,
        winston = require('winston');

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'point.log' })
        ]
    });

    try {
        var prodHostName = require('../config/configProd.json')["production"].hostName;
        if (prodHostName) {
            hostName = prodHostName;
        }
    } catch (e) {
        console.log(e);
    }

    router.get('/point/:user_id', function(req, res) {
        Point.findAll({
            where: {
                UserId: req.params.user_id
            }
        }).then(function(points) {
            var pointTotal = 0;

            points.forEach(function(pointModel){
                if (pointModel.pointValue) {
                    pointTotal += pointModel.pointValue;
                }
            });

            var dict = {};
            res.statusCode = 200;

            dict.message = 'Get points succeeded!';
            dict.point_objects_count = points.length;
            dict.point_total = pointTotal;
            res.json(dict);

        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get points failed';
            dict.error = error;
            res.json(dict);
        });
    });
};