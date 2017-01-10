module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Comment = sequelize.define('Comment',
        {
            description: {
                type: DataTypes.TEXT
            },
            commentOn: {
                type: DataTypes.ENUM('post', 'answer')
            },
            commentOnId: {
                type: DataTypes.INTEGER
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Comment.belongsTo(models.User);
                }
            }
        });

    return Comment;
};