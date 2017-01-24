module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Vote = db.Vote,
        Point = db.Point,
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

        Vote.findAll({
            where: {
                voteOn: voteOn,
                voteOnId: voteOnId
            }
        }).then(function(votes) {
            if (votes.length < 1) {
                dict.message ='Cannot find votes for this post!';
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
        }).catch(function(error) {
            res.statusCode = 500;

            dict.message = 'Get votes failed';
            dict.error = error;
            res.json(dict);
        });
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
        Vote.findAll({
            where: {
                voteOn: valid.voteOn,
                voteOnId: valid.voteOnId,
                UserId: valid.UserId
            }
        }).then(function(votes) {
            if (votes.length < 1) {
                Vote.create(valid).then(function(vote) {
                    var dict = {};
                    for (var key in availableFields) {
                        if (availableFields.hasOwnProperty(key)) {
                            dict[availableFields[key]] = vote[key];
                        }
                    }

                    if (valid.voteValue === '1') {
                        var pointData = {};

                        pointData.UserId = valid.post_or_answer_owner_user;
                        pointData.fromUserId = valid.UserId;
                        pointData.pointValue = 20;
                        pointData.pointOn = valid.voteOn;
                        pointData.pointOnId = valid.voteOnId;
                        
                        Point.create(pointData).then(function(point){
                            dict.message = 'Vote created and point assigned';
                            res.json(dict);
                        });
                    } else {
                        dict.message = 'Vote created and but point is not assigned';
                        res.json(dict);
                    }

                }).catch(function(error) {
                    res.statusCode = 422;
                    var dict = {message: 'Validation Failed', errors: []},
                        errors = error.errors[0];

                    dict.errors.push(errors);
                    res.json(dict);
                });
            } else {
                var vote = votes[0];
                var previousVoteValue = vote.voteValue;

                vote.update({
                    voteValue: valid.voteValue
                }).then(function() {
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
                        pointData.pointOn = valid.voteOn;
                        pointData.pointOnId = valid.voteOnId;
                            
                        Point.create(pointData).then(function(point){
                            dict.message = 'Vote updated and point assigned';
                            res.json(dict);
                        });
                    } else if (previousVoteValue === '1' && valid.voteValue === '-1') {
                        Point.findAll({
                            where: {
                                pointOn: valid.voteOn,
                                pointOnId: valid.voteOnId,
                                UserId: valid.post_or_answer_owner_user,
                                fromUserId: valid.UserId
                            }
                        }).then(function(points) {
                            var point = points[0];

                            point.destroy({ force: true });
                            res.statusCode = 200;
                            var dict = {message: 'Vote updated and point deleted'};
                            res.json(dict);
                        }).catch(function(error) {
                            res.statusCode = 422;
                            var dict = {message: 'Finding the point failed... ', errors: []},
                                errors = error.errors[0];

                            dict.errors.push(errors);
                            res.json(dict);
                        });
                    } else {
                        //Don't do anything with points because vote is not updating
                        dict.message = "Vote updated but no point assigned because voteValue didn't change";
                        res.json(dict);
                    }
                }).catch(function(error) {
                    res.statusCode = 422;
                    var dict = {message: 'Validation Failed', errors: []},
                        errors = error.errors[0];

                    dict.errors.push(errors);
                    res.json(dict);
                });
            }
        }).catch(function(error) {
            res.statusCode = 500;
            var dict = {};
            dict.message = 'Posting vote failed';
            dict.error = error;
            res.json(dict);
        });
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
        Vote.findAll({
            where: {
                voteOn: valid.voteOn,
                voteOnId: valid.voteOnId,
                UserId: valid.UserId
            }
        }).then(function(votes) {
            if (votes.length < 1) {
                res.statusCode = 200;
                var dict = {message: 'Vote does not exist'};
                res.json(dict);
            } else {
                var vote = votes[0];

                vote.destroy({ force: true });

                Point.findAll({
                    where: {
                        pointOn: valid.voteOn,
                        pointOnId: valid.voteOnId,
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
        }).catch(function(error) {
            res.statusCode = 500;

            dict.message = 'Posting vote failed';
            dict.error = error;
            res.json(dict);
        });
    });
};