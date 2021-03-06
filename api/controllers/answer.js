module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Answer = db.Answer,
        Point_On_Answer = db.Point_On_Answer,
        Point_On_Post = db.Point_On_Post,
        Notification = db.Notification,
        availableFields = {
            'description': 'description'
        },
        winston = require('winston');

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'answer.log' })
        ]
    });

    //Get answers that belong to 1 post
    router.get('/answer', function(req, res) {
        var queryParams = req.query;
        var postFindingOptions = {};

        if (queryParams.post_id) {
            if (!postFindingOptions.where) {
                postFindingOptions.where = {};
            }
            postFindingOptions.where.PostId = queryParams.post_id;
        }

        Answer.findAll(postFindingOptions).then(function(answers) {
            var dict = {};

            if (answers.length < 1) {
                dict.message ='Cannot find answers for this post!';
                dict.answers_found = answers.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Answers found!';
                dict.answers_found = answers.length;
                res.statusCode = 200;
                dict.answers = answers;
                res.json(dict);
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get answers failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Get answers that belong to 1 post
    router.get('/answer/:answer_id', function(req, res) {
        Answer.findAll({
            where: {
                id: req.params.answer_id
            }
        }).then(function(answers) {
            var dict = {};

            if (answers.length < 1) {
                dict.message ='Cannot find answers for this post!';
                dict.answers_found = answers.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Answer found!';
                res.statusCode = 200;
                dict.answer = answers[0];
                res.json(dict);
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get answers failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Create a answer
    router.post('/answer', auth, function(req, res) {
        var data = req.body,
            acceptedField = {
                'description': 'description',
                'post_or_answer_owner_user': 'post_or_answer_owner_user'
            },
            valid = {};

        for (var key in acceptedField) {
            if (acceptedField.hasOwnProperty(key)) {
                var dataKey = acceptedField[key];
                valid[key] = data[dataKey];
            }
        }

        valid.UserId = req.userId;          //User id of the answer
        valid.PostId = data.post_id;        //id of the post
        //post_or_answer_owner_user           id of the user that created the post

        Answer.create(valid).then(function(answer) {
            var dict = {};
            var pointDictForOriginalPost = {};
            var pointDictForAnswer = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = answer[key];
                }
            }

            pointDictForOriginalPost.PostId = data.post_id;
            pointDictForOriginalPost.pointValue = 10;
            pointDictForOriginalPost.UserId = valid.post_or_answer_owner_user;
            pointDictForOriginalPost.fromUserId = valid.UserId;

            Point_On_Post.create(pointDictForOriginalPost).then(function(originalPostPoint){

                pointDictForAnswer.AnswerId = answer.id;
                pointDictForAnswer.pointValue = 10;
                pointDictForAnswer.UserId = valid.UserId;
                pointDictForAnswer.fromUserId = valid.UserId;

                Point_On_Answer.create(pointDictForAnswer).then(function(answerPoint){
                    var notificationDict = {};

                    //Because valid.UserId might be int and post_or_... might be string
                    if (valid.UserId != valid.post_or_answer_owner_user) {
                        notificationDict.fromUserId = valid.UserId;
                        notificationDict.notificationOn = 'post';
                        notificationDict.notificationOnId = data.post_id;
                        notificationDict.readStatus = 'unread';
                        notificationDict.notificationAction = 'answer_on_post';
                        notificationDict.UserId = valid.post_or_answer_owner_user;

                        Notification.create(notificationDict).then(function(notificationModel){
                            dict.message = 'Answer created, point created for original post, point created for answer and notification created!'
                            res.json(dict);
                        }).catch(function(error){
                            dict.message = 'Answer created, point created for original post, and point created for answer, but notification creation failed!'
                            res.json(dict);
                        });
                    } else {
                        dict.message = 'Answer created, point created for original post, point created for answer but notification not created because fromUser is same as answer or post owner!'
                        res.json(dict);
                    }
                }).catch(function(error){
                    dict.message = 'Answer created and point created for original post owner user but creating point for answerer failed!'
                    res.json(dict);
                });
            }).catch(function(error){
                dict.message = 'Answer created but there was a problem creating a point for original post owner user!'
                res.json(dict);
            });
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Create answer failed';
            dict.error = error;
            res.json(dict);
        });
    });

    router.put('/answer/:answer_id', auth, function(req, res) {
        var data = req.body,
            acceptedField = {
                'description': 'description'
            },
            valid = {};

        for (var key in acceptedField) {
            if (acceptedField.hasOwnProperty(key)) {
                var dataKey = acceptedField[key];
                valid[key] = data[dataKey];
            }
        }

        Answer.findAll({
            where: {
                id: req.params.answer_id
            }
        }).then(function(answers) {
            var dict = {};
            var answer;

            if (answers.length < 1) {
                dict.message ='Cannot find what you are trying to update!';
                res.statusCode = 404;
                res.json(dict);
            } else {
                answer = answers[0];

                answer.update(valid).then(function(updatedAnswerObject){
                    dict.message ='Answer updated!!';
                    res.statusCode = 200;
                    dict.answer = updatedAnswerObject;
                    res.json(dict);
                }).catch(function(){
                    dict.message ='Found the answer, but something went wrong during update!!';
                    res.statusCode = 500;
                    res.json(dict);
                });
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get answers failed';
            dict.error = error;
            res.json(dict);
        });
    });
};