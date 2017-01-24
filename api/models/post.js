module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Post = sequelize.define('Post',
        {
            title: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
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
                    Post.hasMany(models.Answer);
                }
            }
        });

    return Post;
};