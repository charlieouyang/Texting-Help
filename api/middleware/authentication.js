module.exports = function (req, res, next) {
    'use strict';

    var failed = function (reason) {
        res.statusCode = 401;
        return res.json({
            'message': reason
        });
    };

    if (req.header('Authorization') !== undefined) {
        var app = require('../'),
            token = req.header('Authorization'),
            db = require('../models'),
            User = db.User;

        User.find({
            where:{token: token}
        }).then(function(user) {
            if (user && user.verifyToken(token)) {
                req.accessToken = token;
                req.userId = user.id;
                req.userInstance = user;
                return next();
            } else {
                failed('Token did not match any users or token has expired');
            }
        });

    } else {
        failed('Requires authentication header');
    }
};