module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Comment_On_Post = sequelize.define('Comment_On_Post',
        {
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Comment_On_Post.belongsTo(models.User);
                    Comment_On_Post.belongsTo(models.Post);
                }
            }
        });

    return Comment_On_Post;
};