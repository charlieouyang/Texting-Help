module.exports = function (router) {
    'use strict';

//------------------ Endpoint lists ------------------
// 1) User login - POST (logging in)
// 2) User info - GET (get user information)
// 3) User info - POST (update user information)
// 4) User delete - DELETE
// 5) User create - POST (create new user)
// 6) Users get - GET (get all users)
//----------------------------------------------------

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        User = db.User,
        availableFields = {
            'id': 'id',
            'username': 'username',
            'name': 'name',
            'email': 'email',
            'createdAt': 'createdAt',
            'updatedAt': 'updatedAt',
            'token': 'token'
        };

    router.post('/login', function(req, res) {
        var data = req.body,
            username = "",
            password = "";

        username = data['username'];
        password = data['password'];

        if (!username || username === "" || !password || password === "") {
            var errorResponse = {message: 'Invalid username or password'};
            res.statusCode = 401; //Unauthorized
            return res.json(errorResponse);
        }

        User.find({
            where:{username: username}
        }).then(function(user) {
            var dict = {},
                token;

            if (user && user.verifyPassword(password)) {
                token = user.generateToken();
                for (var key in availableFields) {
                    if (availableFields.hasOwnProperty(key)) {
                        dict[availableFields[key]] = user[key];
                    }
                }
            } else {
                dict = {message: 'Not Found'};
                res.statusCode = 404;
            }

            return res.json(dict);
        }).catch(function(error) {
            res.statusCode = 422;
            var dict = {message: 'Validation Failed', errors: []},
                errors = error;

            dict.errors.push(errors);
            res.json(dict);
        });
    });

    router.get('/users/:username', auth, function(req, res, next) {
        User.find({
            where:{username: req.params.username}
        }).then(function(user) {
            var dict = {};
            if (user) {
                for (var key in availableFields) {
                    if (availableFields.hasOwnProperty(key)) {
                        dict[availableFields[key]] = user[key];
                    }
                }
            } else {
                dict = {message: 'Not Found'};
                res.statusCode = 404;
            }

            return res.json(dict);
        }).catch(function() {
            next();
        });
    });

    router.put('/users/:username', auth, function(req, res) {
        var data = req.body,
            acceptedField = {
                'username': 'username',
                'password': 'password',
                'name': 'name',
                'email': 'email'
            },
            valid = {};

        for (var key in acceptedField) {
            if (acceptedField.hasOwnProperty(key)) {
                var dataKey = acceptedField[key];
                if (data[dataKey]) {
                    valid[key] = data[dataKey];
                }
            }
        }

        User.update(valid, {
            where: { 
                username: req.params.username
            }
        })
        .then(function(user, meta, anotherAttr){
            //This isn't getting me the return user...
            var dict = {};
            if (user) {
                for (var key in availableFields) {
                    if (availableFields.hasOwnProperty(key)) {
                        dict[availableFields[key]] = user[key];
                    }
                }
            } else {
                dict = {message: 'Not Found'};
                res.statusCode = 404;
            }
            res.json(dict);
        })
        .catch(function(error){
            res.statusCode = 422;
            var dictValidation = {message: 'Validation Failed', errors: []},
                errors = error.errors[0];

            dictValidation.errors.push(errors);
            res.json(dictValidation);
        });
    });

    router.delete('/users/:username', auth, function(req, res) {

        User.destroy({
            where: { 
                username: req.params.username
            }
        })
        .then(function(user, meta, anotherAttr){
            //This isn't getting me the return user...
            var dict = {};
            if (user) {
                for (var key in availableFields) {
                    if (availableFields.hasOwnProperty(key)) {
                        dict[availableFields[key]] = user[key];
                    }
                }
            } else {
                dict = {message: 'Not Found'};
                res.statusCode = 404;
            }
            res.json(dict);
        })
        .catch(function(error){
            res.statusCode = 422;
            var dictValidation = {message: 'Validation Failed', errors: []},
                errors = error.errors[0];

            dictValidation.errors.push(errors);
            res.json(dictValidation);
        });
    });

    //TODO: undo of REMOVED AUTH for dev purposes
    router.post('/users', function(req, res) {
        var data = req.body,
            acceptedField = {
                'username': 'username',
                'password': 'password',
                'name': 'name',
                'email': 'email'
            },
            valid = {};

        for (var key in acceptedField) {
            if (acceptedField.hasOwnProperty(key)) {
                var dataKey = acceptedField[key];
                valid[key] = data[dataKey];
            }
        }

        User.create(valid).then(function(user) {
            var dict = {};
            for (var key in availableFields) {
                if (availableFields.hasOwnProperty(key)) {
                    dict[availableFields[key]] = user[key];
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

    router.get('/users', auth, function(req, res) {
        User.findAll().then(function(users) {
            var response = [];
            users.forEach(function(user) {
                var dict = {};
                for (var key in availableFields) {
                    if (availableFields.hasOwnProperty(key)) {
                        dict[availableFields[key]] = user[key];
                    }
                }

                if (Object.keys(dict).length > 0) {
                    response.push(dict);
                }
            });
            res.json(response);
        });
    });
};