module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Post = sequelize.define('Post',
        {
            title: {
                type: DataTypes.TEXT
            },
            description: {
                type: DataTypes.TEXT
            },
            tags: {
                type: DataTypes.TEXT
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Post.belongsTo(models.User);
                }
            }
        });

    return Post;
};