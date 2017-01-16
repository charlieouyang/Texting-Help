module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        fs = require('fs'),
        Post = db.Post,
        Answer = db.Answer,
        Comment = db.Comment,
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
            new (winston.transports.File)({ filename: 'post.log' })
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

    //Get all posts
    //Gotta 
    router.get('/post', function(req, res) {
        Post.findAndCountAll({
            include: [{
                model: Answer,
                as: 'Answers'
            }],
            offset: 0,
            limit: 10
        }).then(function(posts) {
            var postRows = posts.rows;
            var dict = {};
            var postIds = [];

            postRows.forEach(function(postObjects){
                postIds.push(postObjects.id);
            });

            Comment.findAll({
                where: {
                    commentOn: 'post',
                    commentOnId: {
                        $or: postIds
                    }
                }
            }).then(function(commentsReturned){
                var commentOnIdToPostDict = {};
                commentsReturned.forEach(function(commentObject){
                    if (commentOnIdToPostDict[commentObject.dataValues.commentOnId]) {
                        commentOnIdToPostDict[commentObject.dataValues.commentOnId].push(commentObject);
                    } else {
                        commentOnIdToPostDict[commentObject.dataValues.commentOnId] = [];
                        commentOnIdToPostDict[commentObject.dataValues.commentOnId].push(commentObject);
                    }
                });

                if (postRows.length < 1) {
                    dict.message ='Posts not found!';
                    dict.posts_found = postRows.length;
                    res.statusCode = 404;
                    res.json(dict);
                } else {
                    postRows.forEach(function(postObject){
                        postObject.dataValues.Comments = commentOnIdToPostDict[postObject.id];
                    });
                    dict.message ='Posts found!';
                    dict.posts_found = postRows.length;
                    res.statusCode = 200;
                    dict.postRows = postRows;
                    res.json(dict);
                }
            });
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get posts failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Get details of 1 post
    router.get('/post/:post_id', function(req, res) {
        Post.findAll({
            include: [{
                model: Answer,
                as: 'Answers'
            }],
            where: {
                id: req.params.post_id
            }
        }).then(function(posts) {
            //Get all the comments for the question,
            //Get all the comments for each answer,
            //Comebine results and send
            var post;
            var dict = {};
            var answerIds;

            if (posts.length) {
                post = posts[0];
                answerIds = [];

                dict.post = post;
                dict.message ='Post found!';
                res.statusCode = 200;

                Comment.findAll({
                    where: {
                        commentOn: 'post',
                        commentOnId: post.id
                    }
                }).then(function(commentsForQuestion){
                    dict.post.dataValues.Comments = commentsForQuestion;

                    if (dict.post.dataValues.Answers.length) {
                        dict.post.dataValues.Answers.forEach(function(answerObject){
                            answerIds.push(answerObject.id);
                        });
                        //Data process and then return post with comments, and answers with comments

                        Comment.findAll({
                            where: {
                                commentOn: 'answer',
                                commentOnId: {
                                    $or: answerIds
                                }
                            }
                        }).then(function(commentsForAnswers){
                            var commentOnIdToAnswerDict = {};
                            
                            commentsForAnswers.forEach(function(commentObject){
                                if (commentOnIdToAnswerDict[commentObject.dataValues.commentOnId]) {
                                    commentOnIdToAnswerDict[commentObject.dataValues.commentOnId].push(commentObject);
                                } else {
                                    commentOnIdToAnswerDict[commentObject.dataValues.commentOnId] = [];
                                    commentOnIdToAnswerDict[commentObject.dataValues.commentOnId].push(commentObject);
                                }
                            });

                            dict.post.dataValues.Answers.forEach(function(answerObject){
                                answerObject.dataValues.Comments = commentOnIdToAnswerDict[answerObject.id];
                            });

                            res.json(dict);
                        });
                    } else {
                        res.json(dict);
                    }
                });
            } else {
                dict.message ='Cannot find this post!';
                dict.posts_found = posts.length;
                res.statusCode = 404;
                res.json(dict);
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get posts failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Create a post
    router.post('/post', auth, function(req, res) {
        var data = req.body,
            acceptedField = {
                'title': 'title',
                'description': 'description',
                'tags': 'tags'
            },
            valid = {};

        for (var key in acceptedField) {
            if (acceptedField.hasOwnProperty(key)) {
                var dataKey = acceptedField[key];
                valid[key] = data[dataKey];
            }
        }

        valid.UserId = req.userId;

        Post.create(valid).then(function(post) {
            var dict = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = post[key];
                }
            }
            res.json(dict);
        }).catch(function(error) {
            res.statusCode = 422;
            var dict = {message: 'Validation Failed', errors: []},
                errors = error.errors[0];

            dict.errors.push(errors);
            res.json(dict);
        });
    });
};