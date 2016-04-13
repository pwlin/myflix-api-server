var path = require('path');
var debug = require('debug')('MyFlix-API-Server:Comics');
var utils = require('../utils');
var comics = {};

comics.index = function (req, res) {
    debug(utils.logd() + ' Comics Index');
    res.send('[]');
};

comics.genres = function (req, res, db, cache) {
    debug(utils.logd() + ' Comics Genres');
    var cacheKey = utils.md5('/comics/genres');
    var cachedGenres = cache.get(cacheKey);
    if (utils.isEmptyObject(cachedGenres)) {
        debug(utils.logd() + ' Fetching FRESH genres');
        var allGenres = [];
        var genresTmp = '';
        db.all('SELECT genre FROM media WHERE mediatype = $mediatype;', {
            $mediatype: 'comics'
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

comics.genre = function (req, res, db, cache) {
    debug(utils.logd() + ' Comics Genre page: ' + req.params.genre);
    if (!req.params.genre) {
        res.send(utils.buildRESTCallback(req.query, []));
    } else {
        var cacheKey = utils.md5('/comics/genre/' + req.params.genre);
        var cachedItems = cache.get(cacheKey);
        if (utils.isEmptyObject(cachedItems)) {
            debug(utils.logd() + ' Fetching FRESH Genre');
            db.all('SELECT * FROM media WHERE mediatype = $mediatype AND genre = $genre AND isnew = $isnew ORDER BY title ASC;', {
                $mediatype: 'comics',
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

comics.search = function (req, res, db, cache) {
    debug(utils.logd() + ' Comics Search page for: ' + req.params.q);
    var cacheKey = utils.md5('/comics/search/' + req.params.q);
    var cachedItems = cache.get(cacheKey);
    if (utils.isEmptyObject(cachedItems)) {
        debug(utils.logd() + ' Fetching FRESH Search for: ' + req.params.q);
        db.all('SELECT * FROM media WHERE mediatype = $mediatype AND title LIKE $q ORDER BY title ASC;', {
            $mediatype: 'comics',
            $q: '%' + req.params.q + '%'
        }, function (err, rows) {
            // OR originaltitle LIKE $q OR actor LIKE $q OR director LIKE $q
            rows = utils.mapMovieRows(rows);
            cache.set(cacheKey, rows);
            res.send(utils.buildRESTCallback(req.query, rows));
        });
    } else {
        debug(utils.logd() + ' Serving CACHED Whats New');
        res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
    }
};

comics.movie = function (req, res, db, cache) {
    debug(utils.logd() + ' Comic page: ' + req.params.id);
    if (!req.params.id) {
        res.send(utils.buildRESTCallback(req.query, []));
    } else {
        var cacheKey = utils.md5('/comics/movie/' + req.params.id);
        var cachedItems = cache.get(cacheKey);
        if (utils.isEmptyObject(cachedItems)) {
            debug(utils.logd() + ' Fetching FRESH Movie');
            db.all('SELECT * FROM movies WHERE id = $id;', {
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

module.exports = comics;