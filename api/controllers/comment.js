module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Comment = db.Comment,
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
                'description': 'description'
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
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = comment[key];
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