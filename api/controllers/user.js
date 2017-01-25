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
            'token': 'token',
            'type': 'type'
        };

    /*

    Type: Email
    Required: username, name, password, email

    Type: Facebook
    Required: username (fb-id), name (fb-name), password (store as 'fb-password')

    */

    router.post('/login', function(req, res) {
        var data = req.body,
            username = "",
            password = "",
            type = "";

        username = data['username'];
        password = data['password'];
        type = data["type"];

        if (!username || username === "") {
            var errorResponse = {message: 'Invalid username'};
            res.statusCode = 401; //Unauthorized
            return res.json(errorResponse);
        } else if ((!password || password === "") && (!type || type === "")) {
            var errorResponse = {message: 'You have to pass in password or type is facebook'};
            res.statusCode = 401; //Unauthorized
            return res.json(errorResponse);
        } else if ((type === 'email') && (!password || password === "")) {
            var errorResponse = {message: 'Type is email, so you have to pass in password'};
            res.statusCode = 401; //Unauthorized
            return res.json(errorResponse);
        }

        if (type === 'facebook') {
            password = "fb-password";
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

    router.get('/users/username/:username', function(req, res, next) {
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

    router.get('/users/:user_id', function(req, res, next) {
        User.find({
            where:{id: req.params.user_id}
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

    router.put('/users/:user_id', auth, function(req, res) {
        var data = req.body,
            acceptedField = {
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
                id: req.params.user_id
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

    router.delete('/users/:user_id', auth, function(req, res) {

        User.destroy({
            where: { 
                id: req.params.user_id
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

        if (data.type === 'facebook') {
            valid.password = 'fb-password';
            valid.email = 'dummy_email@facebook.com';
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

    router.get('/users', function(req, res) {
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