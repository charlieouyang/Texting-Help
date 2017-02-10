module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Comment_On_Post = db.Comment_On_Post,
        Comment_On_Answer = db.Comment_On_Answer,
        Point_On_Post = db.Point_On_Post,
        Point_On_Answer = db.Point_On_Answer,
        Point_On_Comment_On_Post = db.Point_On_Comment_On_Post,
        Point_On_Comment_On_Answer = db.Point_On_Comment_On_Answer,
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

        if (commentOn === 'post') {
            Comment_On_Post.findAll({
                where: {
                    PostId: commentOnId
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
        } else {
            Comment_On_Answer.findAll({
                where: {
                    AnswerId: commentOnId
                }
            }).then(function(comments) {
                if (comments.length < 1) {
                    dict.message ='Cannot find comments for this answer!';
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
        }
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
        var commentCreatedCallback = function(comment) {
            var dict = {};
            var pointDictForOriginal = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = comment[key];
                }
            }

            pointDictForOriginal.pointValue = 10;
            pointDictForOriginal.UserId = valid.post_or_answer_owner_user;
            pointDictForOriginal.fromUserId = valid.UserId;

            if (valid.commentOn === 'post') {
                pointDictForOriginal.PostId = valid.commentOnId;
                Point_On_Post.create(pointDictForOriginal).then(function(originalPostPoint) {
                    pointForOriginalUserCreatedCallback(comment);
                }).catch(function(error) {
                    dict.message = 'Comment created but there was a problem creating a point for original post owner user!'
                    res.json(dict);
                });
            } else {
                pointDictForOriginal.AnswerId = valid.commentOnId;
                Point_On_Answer.create(pointDictForOriginal).then(function(originalPostPoint) {
                    pointForOriginalUserCreatedCallback(comment);
                }).catch(function(error) {
                    dict.message = 'Comment created but there was a problem creating a point for original answer owner user!'
                    res.json(dict);
                });
            }
        };
        var pointForOriginalUserCreatedCallback = function(comment) {
            var dict = {};
            var pointDictForNewlyCreated = {};

            pointDictForNewlyCreated.pointValue = 10;
            pointDictForNewlyCreated.UserId = valid.UserId;
            pointDictForNewlyCreated.fromUserId = valid.UserId;

            if (valid.commentOn === 'post') {
                pointDictForNewlyCreated.CommentOnPostId = comment.id;
                Point_On_Comment_On_Post.create(pointDictForNewlyCreated).then(function(answerPoint) {
                    setNotifications();
                }).catch(function(error) {
                    dict.message = 'Comment created and point created for original post owner user but creating point for commenter failed!'
                    res.json(dict);
                });
            } else {
                pointDictForNewlyCreated.CommentOnAnswerId = comment.id;
                 Point_On_Comment_On_Answer.create(pointDictForNewlyCreated).then(function(answerPoint) {
                    setNotifications();
                }).catch(function(error) {
                    dict.message = 'Comment created and point created for original answer owner user but creating point for commenter failed!'
                    res.json(dict);
                });
            }
        };
        var setNotifications = function() {
            var dict = {};
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

                Notification.create(notificationDict).then(function(notificationModel) {
                    dict.message = 'Comment created, point created for original post, point created for answer and notification created!'
                    res.json(dict);
                }).catch(function(error) {
                    dict.message = 'Comment created, point created for original post, and point created for answer, but notification creation failed!'
                    res.json(dict);
                });
            } else {
                dict.message = 'Comment created, point created for original post, and point created for comment but notification not created because fromUser is same as answer or post owner!'
                res.json(dict);
            }
        };

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

        if (valid.commentOn === 'post') {
            valid.PostId = data.post_id;
            Comment_On_Post.create(valid).then(function(comment) {
                commentCreatedCallback(comment);
            }).catch(function(error) {
                res.statusCode = 500;
                var dict = {message: 'Creating the comment on the post failed!'};

                dict.error = error;
                res.json(dict);
            });
        } else {
            valid.AnswerId = data.answer_id;
            Comment_On_Answer.create(valid).then(function(comment) {
                commentCreatedCallback(comment);
            }).catch(function(error) {
                res.statusCode = 500;
                var dict = {message: 'Creating the comment on the answer failed!'};

                dict.error = error;
                res.json(dict);
            });
        }
    });
};