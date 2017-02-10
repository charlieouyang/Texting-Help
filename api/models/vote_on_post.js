module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Vote_On_Post = sequelize.define('Vote_On_Post',
        {
            voteValue: {
                type: DataTypes.ENUM('1', '-1'),
                allowNull: false
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Vote_On_Post.belongsTo(models.User);
                    Vote_On_Post.belongsTo(models.Post);
                }
            }
        });

    return Vote_On_Post;
};