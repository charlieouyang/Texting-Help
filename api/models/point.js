module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Point = sequelize.define('Point',
        {
            fromUserId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            pointValue: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            pointOn: {
                type: DataTypes.ENUM('post', 'answer', 'comment'),
                allowNull: false
            },
            pointOnId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Point.belongsTo(models.User);
                }
            }
        });

    return Point;
};

/*

    How to get points??
    - You get 20 points when someone upvotes your question or your post
        - When someone upvotes... Insert into points table

    - You get 10 points when you ask a question
        - When you post a question... Insert into points table

    - You get 10 points when you answer a question, 
        and original asker of question gets 10 points
        - When you answer a question... Insert into points table

    - You get 10 points when you comment on anything, 
        and original post or answer gets 10 points
        - When you comment... Insert into points table

    Points Table
        Id
        ToUserId
        FromUserId - Optional
        PointType
        PointId
        Value enum(5, 10, 20)

    */