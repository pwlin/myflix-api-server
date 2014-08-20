var path = require('path');
var debug = require('debug')('MyFlix-API:Movies');
var utils = require('../utils');
var movies = {};

movies.index = function(req, res) {
	debug('Movies Index');
	res.send('[]');
};

movies.genres = function(req, res, db, cache) {
	debug('Movies Genres');
	var cacheKey = utils.md5('/movies/genres');
	var cachedGenres = cache.get(cacheKey);
	if (utils.isEmptyObject(cachedGenres)) {
		debug('Fetching FRESH genres');
		var allGenres = [];
		var genresTmp = '';
		db.all('SELECT genre FROM movies;', function(err, rows) {
			utils.forEach(rows, function(key, item) {
				genresTmp += '' + item.genre.trim() + ',';
			});
			allGenres = genresTmp.split(',');
			allGenres = utils.arrayUnique(allGenres);
			allGenres = allGenres.filter(function(x) { if(x !== '') { return true;} });
			allGenres = allGenres.sort();
			cache.set(cacheKey, allGenres);
			res.send(utils.buildRESTCallback(req.query, allGenres));
		});
	} else {
		debug('Serving CACHED genres');
		res.send(utils.buildRESTCallback(req.query, cachedGenres[cacheKey]));
	}
};

movies.genre = function(req, res, db, cache) {
	debug('Movies Genre page: ' + req.params.genre);
	if (!req.params.genre) {
		res.send(utils.buildRESTCallback(req.query, []));
	} else {
		var cacheKey = utils.md5('/movies/genre/' + req.params.genre);
		var cachedItems = cache.get(cacheKey);
		if (utils.isEmptyObject(cachedItems)) {
			debug('Fetching FRESH Genre');
			db.all('SELECT * FROM movies WHERE genre LIKE $genre AND isnew = $isnew ORDER BY title ASC;', { $genre : '%' + req.params.genre + '%', $isnew : 'no'}, function(err, rows) {
				rows = utils.mapMovieRows(rows);
				cache.set(cacheKey, rows);
				res.send(utils.buildRESTCallback(req.query, rows));
			});
		} else {
			debug('Serving CACHED Genre');
			res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
		}
	}
};

movies.whatsnew = function(req, res, db, cache) {
	debug('Movies Whats New page');
	var cacheKey = utils.md5('/movies/whatsnew');
	var cachedItems = cache.get(cacheKey);
	if (utils.isEmptyObject(cachedItems)) {
		debug('Fetching FRESH Whats New');
		db.all('SELECT * FROM movies WHERE isnew = $isnew ORDER BY title ASC;', { $isnew : 'yes'}, function(err, rows) {
			rows = utils.mapMovieRows(rows);
			cache.set(cacheKey, rows);
			res.send(utils.buildRESTCallback(req.query, rows));
		});
	} else {
		debug('Serving CACHED Whats New');
		res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
	}
};

movies.search = function(req, res, db, cache) {
	debug('Movies Search page for: ' + req.params.q);
	var cacheKey = utils.md5('/movies/search/' + req.params.q);
	var cachedItems = cache.get(cacheKey);
	if (utils.isEmptyObject(cachedItems)) {
		debug('Fetching FRESH Search for: ' + req.params.q);
		db.all('SELECT * FROM movies WHERE title LIKE $q ORDER BY title ASC;', { $q : '%' + req.params.q + '%'}, function(err, rows) {
			// OR originaltitle LIKE $q OR actor LIKE $q OR director LIKE $q
			rows = utils.mapMovieRows(rows);
			cache.set(cacheKey, rows);
			res.send(utils.buildRESTCallback(req.query, rows));
		});
	} else {
		debug('Serving CACHED Whats New');
		res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
	}
};

movies.movie = function(req, res, db, cache) {
	debug('Movie page: ' + req.params.id);
	if (!req.params.id) {
		res.send(utils.buildRESTCallback(req.query, []));
	} else {
		var cacheKey = utils.md5('/movies/movie/' + req.params.id);
		var cachedItems = cache.get(cacheKey);
		if (utils.isEmptyObject(cachedItems)) {
			debug('Fetching FRESH Movie');
			db.all('SELECT * FROM movies WHERE id = $id;', { $id : req.params.id }, function(err, rows) {
				rows = utils.mapMovieRows(rows);
				cache.set(cacheKey, rows);
				res.send(utils.buildRESTCallback(req.query, rows));
			});
		} else {
			debug('Serving CACHED Movie');
			res.send(utils.buildRESTCallback(req.query, cachedItems[cacheKey]));
		}
	}
};

module.exports = movies;
