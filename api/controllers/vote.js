module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Vote_On_Post = db.Vote_On_Post,
        Vote_On_Answer = db.Vote_On_Answer,
        Point_On_Post = db.Point_On_Post,
        Point_On_Answer = db.Point_On_Answer,
        Notification = db.Notification,
        availableFields = {
            'voteValue': 'voteValue'
        },
        winston = require('winston');

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'vote.log' })
        ]
    });

    //Get votes that belong to 1 post or 1 answer
    //Expects post_id or answer_id
    router.get('/vote', function(req, res) {
        var postId = req.query.post_id;
        var answerId = req.query.answer_id;
        var voteOn;
        var voteOnId;
        var dict = {};
        var numberOfUpvotes = 0;
        var numberOfDownvotes = 0;
        var processVotes = function(votes, type) {
            if (votes.length < 1) {
                if (type === 'post') {
                    dict.message ='Cannot find votes for this post!';
                } else {
                    dict.message ='Cannot find votes for this answer!';
                }
                dict.votes_found = votes.length;
                res.statusCode = 200;
                res.json(dict);
            } else {
                //Data process.. We want to find out how many upvotes, and how many
                //downvotes
                votes.forEach(function(voteModel){
                    if (voteModel.voteValue === '1') {
                        numberOfUpvotes++;
                    } else {
                        numberOfDownvotes++;
                    }
                });

                dict.message ='Votes found!';
                dict.votes_found = votes.length;
                res.statusCode = 200;
                dict.votes = votes;
                dict.number_of_upvotes = numberOfUpvotes;
                dict.number_of_downvotes = numberOfDownvotes;
                res.json(dict);
            }
        };

        if (!postId && answerId) {
            voteOn = 'answer';
            voteOnId = parseInt(answerId);
        } else if (postId && !answerId) {
            voteOn = 'post';
            voteOnId = parseInt(postId);
        } else {
            res.statusCode = 200;
            dict.message = 'Please pass in a post_id or answer_id';
            res.json(dict);
            return;
        }

        if (voteOn === 'post') {
            Vote_On_Post.findAll({
                where: {
                    PostId: voteOnId
                }
            }).then(function(votes){

                processVotes(votes, 'post');

            }).catch(function(error){
                res.statusCode = 500;

                dict.message = 'Get votes for post failed';
                dict.error = error;
                res.json(dict);
            });
        } else {
            Vote_On_Answer.findAll({
                where: {
                    AnswerId: voteOnId
                }
            }).then(function(votes){
                
                processVotes(votes, 'answer');

            }).catch(function(error){
                res.statusCode = 500;

                dict.message = 'Get votes for answer failed';
                dict.error = error;
                res.json(dict);
            });
        }
    });

    //Create a vote
    //Pass in post_id or answer_id
    router.post('/vote', auth, function(req, res) {
        var data = req.body,
            acceptedField = {
                'voteValue': 'voteValue',
                'post_or_answer_owner_user': 'post_or_answer_owner_user'
            },
            valid = {};
        var voteCreationCallback = function(vote, type) {
            var dict = {};
            if (valid.voteValue === '1') {
                var pointData = {};

                pointData.UserId = valid.post_or_answer_owner_user;
                pointData.fromUserId = valid.UserId;
                pointData.pointValue = 20;

                if (type === 'post') {
                    pointData.PostId = valid.voteOnId;
                    Point_On_Post.create(pointData).then(function(point){

                        pointCreateCallback();  //Creating notification here

                    }).catch(function(error){
                        dict.message = 'Vote created and creating point failed';
                        res.json(dict);
                    });
                } else {
                    pointData.AnswerId = valid.voteOnId;
                    Point_On_Answer.create(pointData).then(function(point){

                        pointCreateCallback();  //Creating notification here

                    }).catch(function(error){
                        dict.message = 'Vote created and creating point failed';
                        res.json(dict);
                    });
                }
            } else {
                dict.message = 'Vote created and but point is not assigned';
                res.json(dict);
            }
        };
        var pointCreateCallback = function(pointData, type) {
            var notificationDict = {};
            var dict = {};

            //Because valid.UserId might be int and post_or_... might be string
            if (valid.UserId != valid.post_or_answer_owner_user) {
                notificationDict.fromUserId = valid.UserId;
                notificationDict.notificationOn = valid.voteOn;
                notificationDict.notificationOnId = valid.voteOnId;

                if (valid.voteOn === 'post') {
                    notificationDict.notificationAction = 'upvote_on_post';
                } else if (valid.voteOn === 'answer') {
                    notificationDict.notificationAction = 'upvote_on_answer';
                }

                notificationDict.readStatus = 'unread';
                notificationDict.UserId = valid.post_or_answer_owner_user;

                Notification.create(notificationDict).then(function(notificationModel) {
                    dict.message = 'Vote created and point assigned and notification created!'
                    res.json(dict);
                }).catch(function(error) {
                    dict.message = 'Vote created and point assigned, but notification creation failed!'
                    res.json(dict);
                });
            } else {
                dict.message = 'Vote created and point assigned but notification not created because fromUser is same as answer or post owner!'
                res.json(dict);
            }
        };
        var voteUpdateCallback = function(vote, type, previousVoteValue) {
            var dict = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = vote[key];
                }
            }

            //If previous vote is -1... Then we are updating to 1
            //That means we gotta create Point
            //Else previous vote is 1... Then we are updating to -1
            //That means we gotta remove Point
            if (previousVoteValue === '-1' && valid.voteValue === '1') {
                var pointData = {};

                pointData.UserId = valid.post_or_answer_owner_user;
                pointData.fromUserId = valid.UserId;
                pointData.pointValue = 20;

                if (valid.voteOn === 'post') {
                    pointData.PostId = valid.voteOnId;
                    Point_On_Post.create(pointData).then(function(point) {
                        dict.message = 'Vote updated and point assigned';
                        res.json(dict);
                    });
                } else {
                    pointData.AnswerId = valid.voteOnId;
                    Point_On_Answer.create(pointData).then(function(point) {
                        dict.message = 'Vote updated and point assigned';
                        res.json(dict);
                    });
                }
            } else if (previousVoteValue === '1' && valid.voteValue === '-1') {
                if (valid.voteOn === 'post') {
                    Point_On_Post.findAll({
                        where: {
                            PostId: valid.voteOnId,
                            UserId: valid.post_or_answer_owner_user,
                            fromUserId: valid.UserId
                        }
                    }).then(function(points) {
                        var point = points[0];

                        point.destroy({
                            force: true
                        });
                        res.statusCode = 200;
                        var dict = {
                            message: 'Vote updated and point deleted'
                        };
                        res.json(dict);
                    }).catch(function(error) {
                        res.statusCode = 422;
                        var dict = {
                                message: 'Finding the point failed... ',
                                errors: []
                            },
                            errors = error.errors[0];

                        dict.errors.push(errors);
                        res.json(dict);
                    });
                } else {
                    Point_On_Answer.findAll({
                        where: {
                            AnswerId: valid.voteOnId,
                            UserId: valid.post_or_answer_owner_user,
                            fromUserId: valid.UserId
                        }
                    }).then(function(points) {
                        var point = points[0];

                        point.destroy({
                            force: true
                        });
                        res.statusCode = 200;
                        var dict = {
                            message: 'Vote updated and point deleted'
                        };
                        res.json(dict);
                    }).catch(function(error) {
                        res.statusCode = 422;
                        var dict = {
                                message: 'Finding the point failed... ',
                                errors: []
                            },
                            errors = error.errors[0];

                        dict.errors.push(errors);
                        res.json(dict);
                    });
                }

            } else {
                //Don't do anything with points because vote is not updating
                dict.message = "Vote updated but no point assigned because voteValue didn't change";
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
            valid.voteOnId = data.post_id;
            valid.voteOn = 'post';
        } else if (data.answer_id) {
            valid.voteOnId = data.answer_id;
            valid.voteOn = 'answer';
        }

        valid.UserId = req.userId;

        //Make sure this vote doesn't exist first... 
        //If it does, update it to new value
        //If it doesn't, then just create new one

        if (valid.voteOn === 'post') {
            Vote_On_Post.findAll({
                where: {
                    PostId: valid.voteOnId,
                    UserId: valid.UserId
                }
            }).then(function(votes){
                if (votes.length < 1) {
                    Vote_On_Post.create({
                        voteValue: valid.voteValue,
                        UserId: valid.UserId,
                        PostId: valid.voteOnId
                    }).then(function(vote){
                        
                        voteCreationCallback(vote, 'post');

                    }).catch(function(error){
                        res.statusCode = 500;
                        var dict = {
                            message: 'Creating votes on post failed!', 
                            errors: error
                        };

                        res.json(dict);
                    });
                } else {
                    //If vote exists already... Update the vote value
                    var vote = votes[0];
                    var previousVoteValue = vote.voteValue;

                    vote.update({
                        voteValue: valid.voteValue
                    }).then(function() {
                        
                        voteUpdateCallback(vote, 'post', previousVoteValue);

                    }).catch(function(error) {
                        res.statusCode = 500;
                        var dict = {
                            message: 'Updating vote on post failed!', 
                            errors: error
                        };

                        res.json(dict);
                    });
                }
            }).catch(function(error){
                res.statusCode = 500;
                var dict = {
                    message: 'Finding votes on post failed!', 
                    errors: error
                };

                res.json(dict);
            });
        } else {
            Vote_On_Answer.findAll({
                where: {
                    AnswerId: valid.voteOnId,
                    UserId: valid.UserId
                }
            }).then(function(votes){
                if (votes.length < 1) {
                    Vote_On_Answer.create({
                        voteValue: valid.voteValue,
                        UserId: valid.UserId,
                        AnswerId: valid.voteOnId
                    }).then(function(vote){

                        voteCreationCallback(vote, 'answer');

                    }).catch(function(){
                        res.statusCode = 500;
                        var dict = {
                            message: 'Creating votes on answer failed!', 
                            errors: error
                        };

                        res.json(dict);
                    });
                } else {
                    //If vote exists already... Update the vote value
                    var vote = votes[0];
                    var previousVoteValue = vote.voteValue;

                    vote.update({
                        voteValue: valid.voteValue
                    }).then(function() {
                        
                        voteUpdateCallback(vote, 'answer', previousVoteValue);

                    }).catch(function(error) {
                        res.statusCode = 500;
                        var dict = {
                            message: 'Updating vote on answer failed!', 
                            errors: error
                        };

                        res.json(dict);
                    });
                }
            }).catch(function(error){
                res.statusCode = 500;
                var dict = {
                    message: 'Finding votes on answer failed!', 
                    errors: error
                };

                res.json(dict);
            });
        }

    });

    router.delete('/vote', auth, function(req, res) {
        var data = req.body,
            valid = {};

        if (data.post_id) {
            valid.voteOnId = data.post_id;
            valid.voteOn = 'post';
        } else if (data.answer_id) {
            valid.voteOnId = data.answer_id;
            valid.voteOn = 'answer';
        }

        valid.UserId = req.userId;
        valid.post_or_answer_owner_user = data.post_or_answer_owner_user;

        if (valid.voteOn === 'post') {
            Vote_On_Post.findAll({
                where: {
                    PostId: valid.voteOnId,
                    UserId: valid.UserId
                }
            }).then(function(votes){
                if (votes.length < 1) {
                    res.statusCode = 200;
                    var dict = {message: 'Vote on post does not exist'};
                    res.json(dict);
                } else {
                    var vote = votes[0];

                    vote.destroy({ force: true });

                    Point_On_Post.findAll({
                        where: {
                            PostId: valid.voteOnId,
                            UserId: valid.post_or_answer_owner_user,
                            fromUserId: valid.UserId
                        }
                    }).then(function(points) {
                        var point = points[0];

                        point.destroy({ force: true });
                        res.statusCode = 200;
                        var dict = {message: 'Vote deleted and point deleted'};
                        res.json(dict);
                    }).catch(function(error) {
                        res.statusCode = 500;
                        var dict = {message: 'Finding the point failed... ', errors: error};
                        res.json(dict);
                    });
                }
            }).catch(function(error){
                res.statusCode = 500;
                var dict = {
                    message: 'Finding votes on post failed!', 
                    errors: error
                };

                res.json(dict);
            });
        } else {
            Vote_On_Answer.findAll({
                AnswerId: valid.voteOnId,
                UserId: valid.UserId
            }).then(function(votes){
                if (votes.length < 1) {
                    res.statusCode = 200;
                    var dict = {message: 'Vote on answer does not exist'};
                    res.json(dict);
                } else {
                    var vote = votes[0];

                    vote.destroy({ force: true });

                    Point_On_Answer.findAll({
                        where: {
                            AnswerId: valid.voteOnId,
                            UserId: valid.post_or_answer_owner_user,
                            fromUserId: valid.UserId
                        }
                    }).then(function(points) {
                        var point = points[0];

                        point.destroy({ force: true });
                        res.statusCode = 200;
                        var dict = {message: 'Vote deleted and point deleted'};
                        res.json(dict);
                    }).catch(function(error) {
                        res.statusCode = 422;
                        var dict = {message: 'Finding the point failed... ', errors: []},
                            errors = error.errors[0];

                        dict.errors.push(errors);
                        res.json(dict);
                    });
                }
            }).catch(function(error){
                res.statusCode = 500;
                var dict = {
                    message: 'Finding votes on answer failed!', 
                    errors: error
                };

                res.json(dict);
            });
        }
    });
};