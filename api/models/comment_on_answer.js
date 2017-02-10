module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Comment_On_Answer = sequelize.define('Comment_On_Answer',
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
                    Comment_On_Answer.belongsTo(models.User);
                    Comment_On_Answer.belongsTo(models.Answer);
                }
            }
        });

    return Comment_On_Answer;
};