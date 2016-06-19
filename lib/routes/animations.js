var path = require('path');
var debug = require('debug')('MyFlix-API-Server:Animations');
var utils = require('../utils');
var animations = {};

animations.index = function (req, res) {
    debug(utils.logd() + ' Animations Index');
    res.send('[]');
};

animations.genres = function (req, res, db, cache) {
    debug(utils.logd() + ' Animations Genres');
    var cacheKey = utils.md5('/animations/genres');
    var cachedGenres = cache.get(cacheKey);
    if (utils.isEmptyObject(cachedGenres)) {
        debug(utils.logd() + ' Fetching FRESH genres');
        var allGenres = [];
        var genresTmp = '';
        db.all('SELECT genre FROM media WHERE mediatype = $mediatype;', {
            $mediatype: 'animations'
        }, function (err, rows) {
            utils.forEach(rows, function (key, item) {
                genresTmp += '' + item.genre.trim() + ',';
            });
            allGenres = genresTmp.split(',');
            allGenres = utils.arrayUnique(allGenres);
            allGenres = allGenres.filter(function (x) {
                if (x !== '') {
                    return true;
                }
            });
            allGenres = allGenres.sort();
            cache.set(cacheKey, allGenres);
            res.send(utils.buildRESTCallback(req.query, allGenres));
        });
    } else {
        debug(utils.logd() + ' Serving CACHED genres');
        res.send(utils.buildRESTCallback(req.query, cachedGenres[cacheKey]));
    }
};

animations.genre = function (req, res, db, cache) {
    debug(utils.logd() + ' Animations Genre page: ' + req.params.genre);
    if (!req.params.genre) {
        res.send(utils.buildRESTCallback(req.query, []));
    } else {
        var cacheKey = utils.md5('/animations/genre/' + req.params.genre);
        var cachedItems = cache.get(cacheKey);
        if (utils.isEmptyObject(cachedItems)) {
            debug(utils.logd() + ' Fetching FRESH Genre');
            db.all('SELECT * FROM media WHERE mediatype = $mediatype AND genre = $genre AND isnew = $isnew ORDER BY title ASC;', {
                $mediatype: 'animations',
                $genre: ' ' + req.params.genre + ' ',
                $isnew: 'no'
            }, function (err, rows) {
                rows = utils.mapMovieRows(rows);
                cache.set(cacheKey, rows);
                res.send(utils.buildRESTCallback(req.query, rows));
            });
        } else {
            debug(utils.logd() + ' Serving CACHED Genre');
            res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
        }
    }
};

animations.search = function (req, res, db, cache) {
    debug(utils.logd() + ' Animations Search page for: ' + req.params.q);
    var cacheKey = utils.md5('/animations/search/' + req.params.q);
    var cachedItems = cache.get(cacheKey);
    var sqlQuery = '';
    if (utils.isEmptyObject(cachedItems)) {
        debug(utils.logd() + ' Fetching FRESH Search for: ' + req.params.q);
        if ((req.params.q).match(/^s\:/ig)) {
            req.params.q = (req.params.q).replace(/^s\:/, '');
            sqlQuery = 'SELECT * FROM media WHERE mediatype = $mediatype AND (title LIKE $q OR originaltitle LIKE $q OR actor LIKE $q OR director LIKE $q OR year LIKE $q OR studio LIKE $q OR country LIKE $q) ORDER BY title ASC;';
        } else {
            sqlQuery = 'SELECT * FROM media WHERE mediatype = $mediatype AND title LIKE $q ORDER BY title ASC;';
        }
        db.all(sqlQuery, {
            $mediatype: 'animations',
            $q: '%' + req.params.q + '%'
        }, function (err, rows) {
            rows = utils.mapMovieRows(rows);
            cache.set(cacheKey, rows);
            res.send(utils.buildRESTCallback(req.query, rows));
        });
    } else {
        debug(utils.logd() + ' Serving CACHED Whats New');
        res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
    }
};

animations.movie = function (req, res, db, cache) {
    debug(utils.logd() + ' Animations page: ' + req.params.id);
    if (!req.params.id) {
        res.send(utils.buildRESTCallback(req.query, []));
    } else {
        var cacheKey = utils.md5('/animations/movie/' + req.params.id);
        var cachedItems = cache.get(cacheKey);
        if (utils.isEmptyObject(cachedItems)) {
            debug(utils.logd() + ' Fetching FRESH Movie');
            db.all('SELECT * FROM media WHERE mediatype = $mediatype AND id = $id;', {
                $mediatype: 'animations',
                $id: req.params.id
            }, function (err, rows) {
                rows = utils.mapMovieRows(rows);
                cache.set(cacheKey, rows);
                res.send(utils.buildRESTCallback(req.query, rows));
            });
        } else {
            debug(utils.logd() + ' Serving CACHED Movie');
            res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
        }
    }
};

module.exports = animations;