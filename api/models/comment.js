module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Comment = sequelize.define('Comment',
        {
            description: {
                type: DataTypes.TEXT
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Comment.belongsTo(models.Post);
                    Comment.belongsTo(models.User);
                }
            }
        });

    return Comment;
};