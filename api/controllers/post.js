module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        fs = require('fs'),
        Post = db.Post,
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
    router.get('/post', auth, function(req, res) {
        Post.findAll().then(function(posts) {
            var dict = {};

            if (posts.length < 1) {
                dict.message ='Posts not found!';
                dict.posts_found = posts.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Posts found!';
                dict.posts_found = posts.length;
                res.statusCode = 200;
                dict.posts = posts;
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

    //Get details of 1 post
    router.get('/post/:post_id', auth, function(req, res) {
        Post.findAll({
            where: {
                id: req.params.post_id
            }
        }).then(function(posts) {
            var dict = {};

            if (posts.length < 1) {
                dict.message ='Cannot find this post!';
                dict.posts_found = posts.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Post found!';
                dict.posts_found = posts.length;
                res.statusCode = 200;
                dict.post = posts[0];
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