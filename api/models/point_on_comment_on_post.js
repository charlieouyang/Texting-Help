module.exports = function(sequelize, DataTypes) {
    'use strict';

    var Point_On_Comment_On_Post = sequelize.define('Point_On_Comment_On_Post',
        {
            fromUserId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            pointValue: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
        },
        {
            classMethods: {
                associate: function(models) {
                    Point_On_Comment_On_Post.belongsTo(models.User);
                    Point_On_Comment_On_Post.belongsTo(models.Comment_On_Post);
                }
            }
        });

    return Point_On_Comment_On_Post;
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