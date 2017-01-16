module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Answer = db.Answer,
        availableFields = {
            'description': 'description'
        },
        winston = require('winston');

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'answer.log' })
        ]
    });

    //Get all answers
    router.get('/answer', function(req, res) {
        Answer.findAll().then(function(answers) {
            var dict = {};

            if (answers.length < 1) {
                dict.message ='Answers not found!';
                dict.answers_found = answers.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Answers found!';
                dict.answers_found = answers.length;
                res.statusCode = 200;
                dict.answers = answers;
                res.json(dict);
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get answers failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Get answers that belong to 1 post
    router.get('/answer/:post_id', function(req, res) {
        Answer.findAll({
            where: {
                PostId: req.params.post_id
            }
        }).then(function(answers) {
            var dict = {};

            if (answers.length < 1) {
                dict.message ='Cannot find answers for this post!';
                dict.answers_found = answers.length;
                res.statusCode = 404;
                res.json(dict);
            } else {
                dict.message ='Answers found!';
                dict.answers_found = answers.length;
                res.statusCode = 200;
                dict.answers = answers;
                res.json(dict);
            }
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Get answers failed';
            dict.error = error;
            res.json(dict);
        });
    });

    //Create a answer
    router.post('/answer', auth, function(req, res) {
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
        valid.PostId = data.post_id;

        Answer.create(valid).then(function(answer) {
            var dict = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = answer[key];
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