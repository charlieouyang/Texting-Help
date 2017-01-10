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

    //Get all comments
    router.get('/comment', auth, function(req, res) {
        Comment.findAll().then(function(comments) {
            var dict = {};

            if (comments.length < 1) {
                dict.message ='Comments not found!';
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
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get comments failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Get comments that belong to 1 post
    router.get('/comment/:post_id', auth, function(req, res) {
        Comment.findAll({
            where: {
                PostId: req.params.post_id
            }
        }).then(function(comments) {
            var dict = {};

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
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get comments failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Create a comment
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

        valid.UserId = req.userId;
        valid.PostId = data.postId;

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