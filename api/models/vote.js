module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Vote = sequelize.define('Vote',
        {
            voteValue: {
                type: DataTypes.ENUM('1', '-1')
            },
            voteOn: {
                type: DataTypes.ENUM('post', 'answer')
            },
            voteOnId: {
                type: DataTypes.INTEGER
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Vote.belongsTo(models.User);
                }
            }
        });

    return Vote;
};