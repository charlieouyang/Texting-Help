module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Answer = sequelize.define('Answer',
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
                    Answer.belongsTo(models.Post);
                    Answer.belongsTo(models.User);
                    Answer.hasMany(models.Comment_On_Answer);
                    Answer.hasMany(models.Vote_On_Answer);
                    Answer.hasMany(models.Point_On_Answer);
                }
            }
        });

    return Answer;
};