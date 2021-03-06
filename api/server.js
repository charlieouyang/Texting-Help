'use strict';

var express = require('express'),
    favicon = require('serve-favicon'),
    db = require('./models'),
    app = express(),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    port = 6080,
    controllers = require('./controllers');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//Enable cors... Gotta remove this after app goes to PROD
// app.use(cors());

app.use(function(req, res, next) {
  console.log('FUFKSDFKJLSDLFIWEJFILJES FIFUCLKSIOECE');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var router = express.Router();
controllers(router);
app.use('/api', router);

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

//Only allow "application/json" Content-Type posts
router.use(function(req, res, next) {
    if (req.method === 'POST' &&
        req.header('content-type') !== 'application/json') {

        res.statusCode = 400;
        return res.json({message: 'Invalid Content-Type'});
    }

    return next();
});

app.listen(port, '127.0.0.1');
console.log('Magic happens on port ' + port);