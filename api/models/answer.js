module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Answer = sequelize.define('Answer',
        {
            description: {
                type: DataTypes.TEXT
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Answer.belongsTo(models.Post);
                    Answer.belongsTo(models.User);
                }
            }
        });

    return Answer;
};