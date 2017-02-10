module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Vote_On_Answer = sequelize.define('Vote_On_Answer',
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
                    Vote_On_Answer.belongsTo(models.User);
                    Vote_On_Answer.belongsTo(models.Answer);
                }
            }
        });

    return Vote_On_Answer;
};