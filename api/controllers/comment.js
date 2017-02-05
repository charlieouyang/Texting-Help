module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Comment = db.Comment,
        Point = db.Point,
        Notification = db.Notification,
        availableFields = {
            'description': 'description'
        },
        winston = require('winston');

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'comment.log' })
        ]
    });

    //Get comments that belong to 1 post or 1 answer
    //Expects post_id or answer_id
    router.get('/comment', function(req, res) {
        var postId = req.query.post_id;
        var answerId = req.query.answer_id;
        var commentOn;
        var commentOnId;
        var dict = {};

        if (!postId && answerId) {
            commentOn = 'answer';
            commentOnId = parseInt(answerId);
        } else if (postId && !answerId) {
            commentOn = 'post';
            commentOnId = parseInt(postId);
        } else {
            res.statusCode = 200;
            dict.message = 'Please pass in a post_id or answer_id';
            res.json(dict);
            return;
        }

        Comment.findAll({
            where: {
                commentOn: commentOn,
                commentOnId: commentOnId
            }
        }).then(function(comments) {
            if (comments.length < 1) {
                dict.message ='Cannot find comments for this post!';
                dict.comments_found = comments.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Comments found!';
                dict.comments_found = comments.length;
                res.statusCode = 200;
                dict.comments = comments;
                res.json(dict);
            }
        }).catch(function(error) {
            res.statusCode = 500;

            dict.message = 'Get comments failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Create a comment
    //Pass in post_id or answer_id
    router.post('/comment', auth, function(req, res) {
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

        if (data.post_id) {
            valid.commentOnId = data.post_id;
            valid.commentOn = 'post';
        } else if (data.answer_id) {
            valid.commentOnId = data.answer_id;
            valid.commentOn = 'answer';
        }

        valid.UserId = req.userId;

        Comment.create(valid).then(function(comment) {
            var dict = {};
            var pointDictForOriginalPost = {};
            var pointDictForAnswer = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = comment[key];
                }
            }

            pointDictForOriginalPost.pointOn = valid.commentOn;
            pointDictForOriginalPost.pointOnId = valid.commentOnId;
            pointDictForOriginalPost.pointValue = 10;
            pointDictForOriginalPost.UserId = valid.post_or_answer_owner_user;
            pointDictForOriginalPost.fromUserId = valid.UserId;

            Point.create(pointDictForOriginalPost).then(function(originalPostPoint){
                pointDictForAnswer.pointOn = 'comment';
                pointDictForAnswer.pointOnId = comment.id;
                pointDictForAnswer.pointValue = 10;
                pointDictForAnswer.UserId = valid.UserId;
                pointDictForAnswer.fromUserId = valid.UserId;

                Point.create(pointDictForAnswer).then(function(answerPoint){
                    var notificationDict = {};

                    //Because valid.UserId might be int and post_or_... might be string
                    if (valid.UserId != valid.post_or_answer_owner_user) {
                        notificationDict.fromUserId = valid.UserId;
                        notificationDict.notificationOn = valid.commentOn;
                        notificationDict.notificationOnId = valid.commentOnId;

                        if (valid.commentOn === 'post') {
                            notificationDict.notificationAction = 'comment_on_post';
                        } else if (valid.commentOn === 'answer') {
                            notificationDict.notificationAction = 'comment_on_answer';
                        }

                        notificationDict.readStatus = 'unread';
                        notificationDict.UserId = valid.post_or_answer_owner_user;

                        Notification.create(notificationDict).then(function(notificationModel){
                            dict.message = 'Comment created, point created for original post, point created for answer and notification created!'
                            res.json(dict);
                        }).catch(function(error){
                            dict.message = 'Comment created, point created for original post, and point created for answer, but notification creation failed!'
                            res.json(dict);
                        });
                    } else {
                        dict.message = 'Comment created, point created for original post, and point created for comment but notification not created because fromUser is same as answer or post owner!'
                        res.json(dict);
                    }
                }).catch(function(error){
                    dict.message = 'Comment created and point created for original post owner user but creating point for commenter failed!'
                    res.json(dict);
                });
            }).catch(function(error){
                dict.message = 'Comment created but there was a problem creating a point for original post owner user!'
                res.json(dict);
            });
        }).catch(function(error) {
            res.statusCode = 422;
            var dict = {message: 'Validation Failed'};

            dict.error = error;
            res.json(dict);
        });
    });
};