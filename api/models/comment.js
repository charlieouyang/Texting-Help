module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Comment = sequelize.define('Comment',
        {
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            commentOn: {
                type: DataTypes.ENUM('post', 'answer'),
                allowNull: false
            },
            commentOnId: {
                type: DataTypes.INTEGER,
                allowNull: false
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