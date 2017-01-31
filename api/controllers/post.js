module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        fs = require('fs'),
        Post = db.Post,
        Answer = db.Answer,
        Comment = db.Comment,
        User = db.User,
        Point = db.Point,
        Vote = db.Vote,
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
    /*
    Filtering and sorting parameters
        - Sort by date... Earliest or Latest?
        - Filter by my answers only
    */
    router.get('/post', function(req, res) {
        var queryParams = req.query;
        var postFindingOptions = {};
        var sortByDateLatest = true;
        var sortByValue;
        var onlyPostMeta = false;
        var resultsPerPage = 10;
        var pageNumber = queryParams.page;

        //If we don't pass in page number, only return number of posts
        if (!pageNumber) {
            onlyPostMeta = true;
        }

        postFindingOptions.offset = (pageNumber - 1) * resultsPerPage;
        postFindingOptions.limit = resultsPerPage;
        postFindingOptions.order = [['updatedAt', 'DESC']];
        postFindingOptions.include = [];
        postFindingOptions.include.push({
            model: Answer,
            as: 'Answers'
        });
        postFindingOptions.include.push({
            model: User,
            as: 'User',
            attributes: ['username', 'id', 'name', 'type']
        });

        if (queryParams.asked_by) {
            if (!postFindingOptions.where) {
                postFindingOptions.where = {};
            }
            postFindingOptions.where.UserId = queryParams.asked_by;
        }

        if (queryParams.search) {
            if (!postFindingOptions.where) {
                postFindingOptions.where = {};
            }
            postFindingOptions.where['$or'] = [];
            postFindingOptions.where['$or'].push({ 
                title: {
                    $like: '%' + queryParams.search + '%'
                }
            });
            postFindingOptions.where['$or'].push({
                description: {
                    $like: '%' + queryParams.search + '%'
                }
            });
        }

        Post.findAndCountAll(postFindingOptions).then(function(posts) {
            var postRows;
            var dict = {};
            var postIds = [];

            if (onlyPostMeta) {
                dict.message ='Posts found!';
                dict.posts_found = posts.count;
                res.statusCode = 200;
                res.json(dict);
                return;
            }

            postRows = posts.rows;
            postRows.forEach(function(postObjects){
                postIds.push(postObjects.id);
            });

            Comment.findAll({
                where: {
                    commentOn: 'post',
                    commentOnId: {
                        $or: postIds
                    }
                },
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['username', 'id', 'name', 'type']
                }]
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

                Vote.findAll({
                    where: {
                        voteOn: 'post',
                        voteOnId: {
                            $or: postIds
                        }
                    }
                }).then(function(votesReturned){
                    var voteOnIdToPostDict = {};
                    var upvoteTotal;
                    votesReturned.forEach(function(voteObject){
                        if (voteOnIdToPostDict[voteObject.dataValues.voteOnId]) {
                            voteOnIdToPostDict[voteObject.dataValues.voteOnId].push(voteObject);
                        } else {
                            voteOnIdToPostDict[voteObject.dataValues.voteOnId] = [];
                            voteOnIdToPostDict[voteObject.dataValues.voteOnId].push(voteObject);
                        }
                    });

                    //Combine all the upvotes here
                    for (var key in voteOnIdToPostDict) {
                        if (voteOnIdToPostDict.hasOwnProperty(key)) {
                            upvoteTotal = 0;

                            voteOnIdToPostDict[key].forEach(function(voteObject){
                                if (voteObject.dataValues.voteValue === '1') {
                                    upvoteTotal++;
                                } else {
                                    upvoteTotal--;
                                }
                            });

                            voteOnIdToPostDict[key] = upvoteTotal;
                        }
                    }

                    if (postRows.length < 1) {
                        dict.message ='Posts not found!';
                        dict.posts_found = postRows.length;
                        dict.total_number_of_posts = posts.count;
                        res.statusCode = 200;
                        res.json(dict);
                    } else {
                        postRows.forEach(function(postObject){
                            postObject.dataValues.Comments = commentOnIdToPostDict[postObject.id];
                            postObject.dataValues.upVoteTotal = voteOnIdToPostDict[postObject.id];
                        });
                        dict.message ='Posts found!';
                        dict.posts_found = postRows.length;
                        dict.total_number_of_posts = posts.count;
                        res.statusCode = 200;
                        dict.postRows = postRows;
                        res.json(dict);
                    }

                }).catch(function(error) {
                    var dict = {};
                    res.statusCode = 500;

                    dict.message = 'Get posts succeeded, get comments succeeded, but get votes failed!';
                    dict.error = error;
                    res.json(dict);
                });
            }).catch(function(error) {
                var dict = {};
                res.statusCode = 500;

                dict.message = 'Get posts succeeded, but get comments failed!';
                dict.error = error;
                res.json(dict);
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
                as: 'Answers',
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['username', 'id', 'name', 'type']
                }]
            },{
                model: User,
                as: 'User',
                attributes: ['username', 'id', 'name', 'type']
            }],
            where: {
                id: req.params.post_id
            }
        }).then(function(posts) {
            //Get all the comments for the question,
            //Get all the comments for each answer,
            //Combine results and send
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
                    },
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: ['username', 'id', 'name', 'type']
                    }]
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
                            },
                            include: [{
                                model: User,
                                as: 'User',
                                attributes: ['username', 'id', 'name', 'type']
                            }]
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
            var pointDict = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = post[key];
                }
            }

            pointDict.pointOn = 'post';
            pointDict.pointOnId = post.id;
            pointDict.pointValue = 10;
            pointDict.UserId = valid.UserId;
            pointDict.fromUserId = valid.UserId;

            Point.create(pointDict).then(function(point){
                dict.message = 'Post created and point created for user!';
                res.json(dict);
            }).catch(function(error){
                dict.message = 'Post created but there was a problem creating a point for user!'
                res.json(dict);
            });
        }).catch(function(error) {
            res.statusCode = 422;
            var dict = {message: 'Validation Failed', errors: []},
                errors = error.errors[0];

            dict.errors.push(errors);
            res.json(dict);
        });
    });

    router.put('/post/:post_id', auth, function(req, res) {
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

        Post.findAll({
            where: {
                id: req.params.post_id
            }
        }).then(function(posts) {
            var dict = {};
            var post;

            if (posts.length < 1) {
                dict.message ='Cannot find you are trying to update!';
                dict.answers_found = posts.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                post = posts[0];

                post.update(valid).then(function(updatedPostObject){
                    dict.message ='Post updated!!';
                    res.statusCode = 200;
                    dict.post = updatedPostObject;
                    res.json(dict);
                }).catch(function(){
                    dict.message ='Found the post, but something went wrong during update!!';
                    res.statusCode = 500;
                    res.json(dict);
                });
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get posts failed';
            dict.error = error;
            res.json(dict);
        });
    });
};