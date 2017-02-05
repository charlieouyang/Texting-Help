module.exports = function (router) {
    'use strict';

    var db = require('../models'),
        auth = require('../middleware/authentication'),
        Notification = db.Notification,
        Answer = db.Answer,
        winston = require('winston');

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'notification.log' })
        ]
    });

    //Get comments that belong to 1 post or 1 answer
    //Expects post_id or answer_id
    router.get('/notification', auth, function(req, res) {
        var userId = req.userId;
        var dict = {};

        if (!userId) {
            res.statusCode = 200;
            dict.message = 'Please pass in a user_id to get the notifications!';
            res.json(dict);
            return;
        }

        Notification.findAll({
            where: {
                UserId: userId
            },
            order: [['createdAt', 'DESC']]
        }).then(function(notifications) {
            var answerIdsToFetch = [];
            var answerFindingOptions = {};
            notifications.forEach(function(notificationObject){
                if (notificationObject.notificationAction === 'comment_on_answer' || 
                    notificationObject.notificationAction === 'upvote_on_answer') {
                    answerIdsToFetch.push({ id: notificationObject.notificationOnId });
                }
            });

            if (answerIdsToFetch.length === 1) {
                answerFindingOptions = answerIdsToFetch[0];
            } else if (answerIdsToFetch.length > 1) {
                answerFindingOptions['$or'] = answerIdsToFetch;

            }

            if (answerIdsToFetch.length > 0) {
                Answer.findAll({
                    where: answerFindingOptions
                }).then(function(answers){
                    var answerToPostId = {};

                    answers.forEach(function(answerModel){
                        answerToPostId[answerModel.id] = answerModel.PostId;
                    });

                    notifications.forEach(function(notificationModel){
                        if (notificationModel.notificationAction === 'comment_on_answer' || 
                            notificationModel.notificationAction === 'upvote_on_answer') {
                            notificationModel.dataValues.parentPostId = answerToPostId[notificationModel.notificationOnId];
                        }
                    });

                    dict.message ='Notifications found!';
                    dict.notifications_found = notifications.length;
                    res.statusCode = 200;
                    dict.notifications = notifications;
                    res.json(dict);
                }).catch(function(error){
                    res.statusCode = 500;

                    dict.message = 'Getting the notifications succeeded, but getting answers failed!';
                    dict.error = error;
                    res.json(dict);
                });
            } else {
                dict.message ='Notifications found!';
                dict.notifications_found = notifications.length;
                res.statusCode = 200;
                dict.notifications = notifications;
                res.json(dict);
            }
        }).catch(function(error) {
            res.statusCode = 500;

            dict.message = 'Get notifications failed';
            dict.error = error;
            res.json(dict);
        });
    });

    router.post('/notification', auth, function(req, res) {
        var userId = req.userId;
        var dict = {};

        Notification.update({ 
            readStatus: 'read' 
        },{
            where: {
                UserId: userId,
                readStatus: 'unread'
            }
        }).then(function(notifications) {
            dict.message ='Unread notifications have been set to read!!';
            res.statusCode = 200;
            dict.number_of_notifications_updated = notifications;
            res.json(dict);
        }).catch(function(error) {
            var dict = {};
            res.statusCode = 500;

            dict.message = 'Updating notification status to read failed!';
            dict.error = error;
            res.json(dict);
        });
    });
};