module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Notification = sequelize.define('Notification',
        {
            fromUserId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            notificationOn: {
                type: DataTypes.ENUM('post', 'answer'),
                allowNull: false
            },
            notificationOnId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            notificationAction: {
                type: DataTypes.ENUM('comment_on_answer', 'comment_on_post', 
                    'answer_on_post', 'upvote_on_post', 'upvote_on_answer'),
                allowNull: false
            },
            readStatus: {
                type: DataTypes.ENUM('read', 'unread'),
                allowNull: false
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Notification.belongsTo(models.User);
                }
            }
        });

    return Notification;
};

/*

    How to get notification??
    - When someone answers your post
    - When someone comments on your post
    - When someone comments on your answer
    - When someone upvotes on your post
    - When someone upvotes on your answer

    */