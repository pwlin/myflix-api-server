var debug = require('debug')('MyFlix-API-Server'),
    utils = require('./utils');

var routes = {};
routes.index = require('./routes/index');
routes.movies = require('./routes/movies');
routes.comics = require('./routes/comics');

function serve(db, config) {
    var NodeCache = require('node-cache');
    var cache = new NodeCache();
    var express = require('express');
    var compression = require('compression');
    var logger = require('morgan');
    var bodyParser = require('body-parser');

    var app = express();

    app.use(compression({
        threshold: 100
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.disable('etag');
    app.disable('x-powered-by');

    app.use(function (req, res, next) {
        //res.removeHeader('X-Powered-By');
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        res.header('Content-Type', 'text/javascript; charset=utf-8');
        res.header('Connection', 'close');
        next();
    });

    app.use('/movies/genre/:genre', function (req, res) {
        routes.movies.genre(req, res, db, cache);
    });

    app.use('/movies/genres', function (req, res) {
        routes.movies.genres(req, res, db, cache);
    });

    app.use('/movies/search/:q', function (req, res) {
        routes.movies.search(req, res, db, cache);
    });

    app.use('/movies/whatsnew', function (req, res) {
        routes.movies.whatsnew(req, res, db, cache);
    });

    app.use('/movies/movie/:id', function (req, res) {
        routes.movies.movie(req, res, db, cache);
    });

    app.use('/movies', function (req, res) {
        routes.movies.index(req, res);
    });

    app.use('/comics/genre/:genre', function (req, res) {
        routes.comics.genre(req, res, db, cache);
    });

    app.use('/comics/genres', function (req, res) {
        routes.comics.genres(req, res, db, cache);
    });

    app.use('/comics/search/:q', function (req, res) {
        routes.comics.search(req, res, db, cache);
    });

    app.use('/comics/movie/:id', function (req, res) {
        routes.comics.movie(req, res, db, cache);
    });

    app.use('/comics', function (req, res) {
        routes.comics.index(req, res);
    });

    app.use('/clearcache', function (req, res) {
        routes.index.clearCache(req, res, cache);
    });

    app.use('/', function (req, res) {
        routes.index.index(req, res);
    });


    /// catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    /// error handlers
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (app.get('env') === 'development') {
            debug(utils.logd() + ' ' + err);
        }
        debug(utils.logd() + ' ' + err.message);
        res.send(err.message);
    });

    app.set('port', config.PORT || 3000);
    app.set('ip', config.IP || '127.0.0.1');

    var server = app.listen(app.get('port'), app.get('ip'), function () {
        debug(utils.logd() + ' Server listening on ' + server.address().address + ':' + server.address().port);
    });

}

module.exports = serve;