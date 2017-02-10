module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        fs = require('fs'),
        Point_On_Answer = db.Point_On_Answer,
        Point_On_Post = db.Point_On_Post,
        Point_On_Comment_On_Post = db.Point_On_Comment_On_Post,
        Point_On_Comment_On_Answer = db.Point_On_Comment_On_Answer,
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
        Point_On_Answer.findAll({
            where: {
                UserId: req.params.user_id
            }
        }).then(function(pointsOnAnswers) {
            Point_On_Post.findAll({
                where: {
                    UserId: req.params.user_id
                }
            }).then(function(pointsOnPosts) {
                Point_On_Comment_On_Post.findAll({
                    where: {
                        UserId: req.params.user_id
                    }
                }).then(function(pointsOnCommentsOnPosts) {
                    Point_On_Comment_On_Answer.findAll({
                        where: {
                            UserId: req.params.user_id
                        }
                    }).then(function(pointsOnCommentsOnAnswers) {

                        var pointTotal = 0;

                        pointsOnAnswers.forEach(function(pointModel){
                            if (pointModel.pointValue) {
                                pointTotal += pointModel.pointValue;
                            }
                        });
                        pointsOnPosts.forEach(function(pointModel){
                            if (pointModel.pointValue) {
                                pointTotal += pointModel.pointValue;
                            }
                        });
                        pointsOnCommentsOnPosts.forEach(function(pointModel){
                            if (pointModel.pointValue) {
                                pointTotal += pointModel.pointValue;
                            }
                        });
                        pointsOnCommentsOnAnswers.forEach(function(pointModel){
                            if (pointModel.pointValue) {
                                pointTotal += pointModel.pointValue;
                            }
                        });

                        var dict = {};
                        res.statusCode = 200;

                        dict.message = 'Get points succeeded!';
                        dict.point_total = pointTotal;
                        res.json(dict);

                    }).catch(function(error) {
                        var dict = {};
                        res.statusCode = 500;

                        dict.message = 'Get points on the comments on answers failed';
                        dict.error = error;
                        res.json(dict);
                    });

                }).catch(function(error) {
                    var dict = {};
                    res.statusCode = 500;

                    dict.message = 'Get points on the comments on posts failed';
                    dict.error = error;
                    res.json(dict);
                });

            }).catch(function(error) {
                var dict = {};
                res.statusCode = 500;

                dict.message = 'Get points on posts failed';
                dict.error = error;
                res.json(dict);
            });

        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get points on answers failed';
            dict.error = error;
            res.json(dict);
        });
    });
};