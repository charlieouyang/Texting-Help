module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        fs = require('fs'),
        Sequelize = require('sequelize'),
        Post = db.Post,
        Answer = db.Answer,
        Comment_On_Answer = db.Comment_On_Answer,
        Comment_On_Post = db.Comment_On_Post,
        User = db.User,
        Point_On_Answer = db.Point_On_Answer,
        Point_On_Post = db.Point_On_Post,
        Point_On_Comment_On_Answer = db.Point_On_Comment_On_Answer,
        Point_On_Comment_On_Post = db.Point_On_Comment_On_Post,
        Vote_On_Answer = db.Vote_On_Answer,
        Vote_On_Post = db.Vote_On_Post,
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
        var searchTermsOrBlocks;
        var dateRangeBlocks;
        var commentedVotedBlocks;

        //If we don't pass in page number, only return number of posts
        if (!pageNumber) {
            onlyPostMeta = true;
        }

        postFindingOptions.offset = (pageNumber - 1) * resultsPerPage;
        postFindingOptions.limit = resultsPerPage;
        postFindingOptions.order = [['updatedAt', 'DESC']];
        postFindingOptions.include = [];
        postFindingOptions.include = [{
            model: Answer,
            as: 'Answers',
            include: [{
                model: Comment_On_Answer,
                as: 'Comment_On_Answers',
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['username', 'id', 'name', 'type']
                }]
            }, {
                model: Vote_On_Answer,
                as: 'Vote_On_Answers'
            }, {
                model: User,
                as: 'User',
                attributes: ['username', 'id', 'name', 'type']
            }]
        }, {
            model: Comment_On_Post,
            as: 'Comment_On_Posts',
            include: [{
                model: User,
                as: 'User',
                attributes: ['username', 'id', 'name', 'type']
            }]
        }, {
            model: Vote_On_Post,
            as: 'Vote_On_Posts'
        }, {
            model: User,
            as: 'User',
            attributes: ['username', 'id', 'name', 'type']
        }];

        if (queryParams.asked_by) {
            if (!postFindingOptions.where) {
                postFindingOptions.where = {};
                postFindingOptions.where['$and'] = [];
            }
            postFindingOptions.where['$and'].push({UserId: queryParams.asked_by});
        }

        if (queryParams.search) {
            if (!postFindingOptions.where) {
                postFindingOptions.where = {};
                postFindingOptions.where['$and'] = [];
            }

            searchTermsOrBlocks = {};
            searchTermsOrBlocks['$or'] = [];

            searchTermsOrBlocks['$or'].push({ 
                title: {
                    $like: '%' + queryParams.search + '%'
                }
            });
            searchTermsOrBlocks['$or'].push({
                description: {
                    $like: '%' + queryParams.search + '%'
                }
            });

            postFindingOptions.where['$and'].push(searchTermsOrBlocks);
        }

        if (queryParams.daterange) {
            if (!postFindingOptions.where) {
                postFindingOptions.where = {};
                postFindingOptions.where['$and'] = [];
            }

            if (queryParams.daterange === 'today') {
                dateRangeBlocks = {
                    updatedAt: {
                        $lt: new Date(),
                        $gt: new Date(new Date() - 24 * 60 * 60 * 1000)
                    }
                };
            } else if (queryParams.daterange === 'this_week') {
                dateRangeBlocks = {
                    updatedAt: {
                        $lt: new Date(),
                        $gt: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
                    }
                };
            } else if (queryParams.daterange === 'this_month') {
                dateRangeBlocks = {
                    updatedAt: {
                        $lt: new Date(),
                        $gt: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
                    }
                };
            } else {
                //If no selections or 'all_time'
                dateRangeBlocks = {
                    updatedAt: {
                        $lt: new Date()
                    }
                };
            }
            postFindingOptions.where['$and'].push(dateRangeBlocks);
        }

        // if (queryParams.votedcommented) {
        //     postFindingOptions.order = [];

        //     if (queryParams.votedcommented === 'most_commented') {
        //         commentedVotedBlocks = {
        //             updatedAt: {
        //                 $lt: new Date(),
        //                 $gt: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        //             }
        //         };
        //     } else if (queryParams.votedcommented === 'most_recent') {
        //         commentedVotedBlocks = {
        //             updatedAt: {
        //                 $lt: new Date(),
        //                 $gt: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        //             }
        //         };
        //     } else {
        //         //If no selections or 'most_voted'
        //         commentedVotedBlocks = {
        //             updatedAt: {
        //                 $lt: new Date()
        //             }
        //         };
        //     }
        //     postFindingOptions.where['$and'].push(commentedVotedBlocks);
        // }

        Post.findAndCountAll(postFindingOptions).then(function(posts) {
            var postRows;
            var dict = {};
            var postIds = [];
            var upVoteTotal;

            if (onlyPostMeta) {
                dict.message ='Posts found!';
                dict.posts_found = posts.count;
                res.statusCode = 200;
                res.json(dict);
                return;
            }

            if (posts.rows.length) {
                dict.count = posts.count;
                dict.posts = posts.rows;

                //Calculate the net upvotes!
                dict.posts.forEach(function(postObject){
                    upVoteTotal = 0;

                    postObject.Vote_On_Posts.forEach(function(voteOnPostObject){
                        if (voteOnPostObject.voteValue === '1') {
                            upVoteTotal++;
                        } else {
                            upVoteTotal--;
                        }
                    });
                    postObject.dataValues.upVoteTotal = upVoteTotal;

                    postObject.Answers.forEach(function(answerObject){
                        upVoteTotal = 0;

                        answerObject.Vote_On_Answers.forEach(function(voteOnAnswerObject){
                            if (voteOnAnswerObject.voteValue === '1') {
                                upVoteTotal++;
                            } else {
                                upVoteTotal--;
                            }
                        });
                        answerObject.dataValues.upVoteTotal = upVoteTotal;
                    });
                });

                dict.message ='Post found!';
                res.statusCode = 200;

                res.json(dict);
            } else {
                dict.message ='No posts found!';
                res.statusCode = 200;
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

    //Get details of 1 post include:[{all:true}]
    router.get('/post/:post_id', function(req, res) {
        Post.findAll({
            include: [{
                model: Answer,
                as: 'Answers',
                include: [{
                    model: Comment_On_Answer,
                    as: 'Comment_On_Answers',
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: ['username', 'id', 'name', 'type']
                    }]
                }, {
                    model: Vote_On_Answer,
                    as: 'Vote_On_Answers'
                }, {
                    model: User,
                    as: 'User',
                    attributes: ['username', 'id', 'name', 'type']
                }]
            }, {
                model: Comment_On_Post,
                as: 'Comment_On_Posts',
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['username', 'id', 'name', 'type']
                }]
            }, {
                model: Vote_On_Post,
                as: 'Vote_On_Posts'
            }, {
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
            var upVoteTotal;

            if (posts.length) {
                post = posts[0];

                upVoteTotal = 0;

                post.Vote_On_Posts.forEach(function(voteOnPostObject){
                    if (voteOnPostObject.voteValue === '1') {
                        upVoteTotal++;
                    } else {
                        upVoteTotal--;
                    }
                });
                post.dataValues.upVoteTotal = upVoteTotal;

                post.Answers.forEach(function(answerObject){
                    upVoteTotal = 0;

                    answerObject.Vote_On_Answers.forEach(function(voteOnAnswerObject){
                        if (voteOnAnswerObject.voteValue === '1') {
                            upVoteTotal++;
                        } else {
                            upVoteTotal--;
                        }
                    });
                    answerObject.dataValues.upVoteTotal = upVoteTotal;
                });


                dict.post = post;
                dict.message ='Post found!';
                res.statusCode = 200;

                res.json(dict);
            } else {
                dict.message ='Cannot find this post!';
                dict.posts_found = posts.length;
                res.statusCode = 404;
                res.json(dict);
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            console.log(error.message);

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

            dict.id = post.id;
            pointDict.PostId = post.id;
            pointDict.pointValue = 10;
            pointDict.UserId = valid.UserId;
            pointDict.fromUserId = valid.UserId;

            Point_On_Post.create(pointDict).then(function(point){
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