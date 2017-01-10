module.exports = function(sequelize, DataTypes) {
    'use strict';

    var bcrypt = require('bcrypt'),
        salt = bcrypt.genSaltSync(10),
        User = sequelize.define('User',
        {
            username: {
                type: DataTypes.STRING,
                unique: 'compositeIndex',
                allowNull: false,
                validate: {
                    isAlphanumeric: {
                        msg: 'invalid_username'
                    },
                    notNull: function(value, next) {
                        if (value === '' || value === undefined) {
                            return next('missing_field');
                        }
                        return next();
                    },
                    isUnique: function (username, next) {
                        var isNew = this.isNewRecord,
                            id = this.id;
                        return User.find({where: {username: username}})
                        .success(function (user) {
                            if (user && (isNew || user.id !== id)) {
                                return next('already_exists');
                            }
                            return next();
                        });
                    }
                }
            },
            email: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    isEmail: {
                        msg: 'invalid_email'
                    },
                    notNull: function(value, next) {
                        if (value === '' || value === undefined) {
                            return next('missing_field');
                        }
                        return next();
                    },
                }
            },
            name: {
                type: DataTypes.TEXT
            },
            password: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notNull: function(value, next) {
                        if (value === '' || value === undefined) {
                            return next('missing_field');
                        }
                        return next();
                    },
                }
            },
            token: {
                type: DataTypes.TEXT
            },
            tokenRefreshTime: DataTypes.BIGINT,
            createdAt:  {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
            updatedAt: DataTypes.DATE,
            isAdmin:  {type: DataTypes.BOOLEAN, defaultValue: false}
        },
        {
            setterMethods: {
                password: function (password) {
                    var hash = bcrypt.hashSync(password, salt);
                    return this.setDataValue('password', hash);
                }
            },
            instanceMethods: {
                verifyPassword: function(password) {
                    return bcrypt.compareSync(password, this.password);
                },
                generateToken: function () {
                    var randomNum = Math.random() * 10,
                        hash;

                    randomNum = randomNum.toString();
                    hash = bcrypt.hashSync(randomNum, salt);
                    this.tokenRefreshTime = Date.now();
                    this.token = hash;
                    this.save();
                    return this.token;
                },
                verifyToken: function(token) {
                    var now = Date.now(),
                        threshold = 86400000, // 1 day in milliseconds
                        difference;

                    difference = now - this.tokenRefreshTime;
                    if (this.token === token && (difference < threshold)) {
                        this.tokenRefreshTime = now;
                        this.save();
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            classMethods: {
                associate: function(models) {
                    User.hasMany(models.Post);
                }
            }
        });

    return User;
};