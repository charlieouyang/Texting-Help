module.exports = function (router) {
    'use strict';

    var fs = require('fs');

    fs.readdirSync('./controllers').forEach(function(file) {
        if (file !== 'index.js') {
            require('./' + file)(router);
        }
    });
};