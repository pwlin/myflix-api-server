var debug = require('debug')('MyFlix-API-Aggregate');
var config = require('../config.json');
var fs = require('fs');
var path = require('path');
var url = require('url');
var sqlite3 = require('sqlite3');
var xml2js = require('xml2js');
var utils = require('./utils');
var db = null;

var sqls = {};

function sqlParamsForMovies(item, folder, folderUri, isnew) {
	var customGenre = path.basename(path.join(folder, '../'));
	if (customGenre === 'Whats New') {
		customGenre = '';
	}
	var params = {};
	params.$imdb = item.id ? item.id[0] : '';
	// params.$title = item.title ? item.title[0] : '';
	params.$title = path.basename(folder);
	params.$originaltitle = item.originaltitle ? item.originaltitle[0] : '';
	params.$plot = item.plot ? item.plot[0] : '';
	params.$folder = folder;
	params.$folderUri = folderUri;
	params.$filename = item.filename[0];
	params.$filenameUri = folderUri + '/' + item.filename[0].replace(/ /ig, '%20');
	params.$cover = '';
	if (fs.existsSync(path.join(folder, 'folder.jpg'))) {
		params.$cover = 'folder.jpg';
	}
	params.$tagline = item.tagline ? item.tagline[0] : '';
	params.$year = item.year ? item.year[0] : '';
	params.$rating = item.rating ? item.rating[0] : '';
	params.$trailer = item.trailer ? item.trailer.join().trim() : '';
	params.$certification = item.certification ? item.certification[0] : '';
	params.$runtime = item.runtime ? item.runtime[0] : '';
	//params.$genre = item.genre[0] ? ' ' + item.genre[0].name.join().trim() + ' ' : '';
	params.$genre = ' ' + customGenre + ' ';
	params.$actor = item.actor[0] ? ' ' + item.actor[0].name.join().trim() + ' ' : '';
	params.$director = item.director[0] ? ' ' + item.director[0].name.join().trim() + ' '  : '';
	params.$country = item.country[0] ? ' ' + item.country[0].name.join().trim() + ' ' : '';
	params.$studio = item.studio[0] ? ' ' + item.studio[0].name.join().trim() + ' ' : '';
	params.$resolution = item.mediainfo[0].resolution && item.mediainfo[0].resolution.length > 0 ? item.mediainfo[0].resolution[0] : '';
	//params.$hassubtitle = item.mediainfo[0].externalsubtitleslist && item.mediainfo[0].externalsubtitleslist.length > 0 ? 'yes' : 'no' ;
	params.$hassubtitle = 'no';
	if (fs.existsSync(path.join(folder, params.$title + '.srt'))) {
		params.$hassubtitle = 'yes';
		if (!fs.existsSync(path.join(folder, params.$title + '.vtt'))) {
			utils.srt2vtt(folder, params.$title);
		}
	}
	params.$language = item.mediainfo[0].languages && item.mediainfo[0].languages.length > 0 ? ' ' + utils.arrayUnique(item.mediainfo[0].languages).join().trim() + ' ' : '';
	params.$durationminutes = item.mediainfo[0].durationminutes && item.mediainfo[0].durationminutes.length > 0 ? item.mediainfo[0].durationminutes[0] : '';
	params.$filesize = item.mediainfo[0].filesize && item.mediainfo[0].filesize.length > 0 ? item.mediainfo[0].filesize[0] : '';
	params.$filesizebytes = item.mediainfo[0].filesizebytes && item.mediainfo[0].filesizebytes.length > 0 ? item.mediainfo[0].filesizebytes[0] : '';
	params.$isnew = isnew;
	return params;
}

function sqlStringForMovies() {
	if (!sqls.insertMovie) {
		sqls.insertMovie = fs.readFileSync(path.join(__dirname, '../schemas/insert-movie.sql'), 'utf-8');
	}
	return sqls.insertMovie;
}

function parseMovies(folder, isnew) {
	isnew = isnew === true ? 'yes' : 'no';
	var newMovies = utils.dirWalk(folder);
	var movieName = '';
	var xmlFileName = '';
	var xmlContent = '';
	var parser = new xml2js.Parser({trim  : true});
	
	var folderUri = '';
	
	utils.forEach(newMovies, function(key, item) {
		movieName = path.basename(key);
		xmlFileName = path.join(key, movieName + '.xml');
		if (fs.existsSync(xmlFileName)) {
			xmlContent = fs.readFileSync(xmlFileName, 'utf-8');
			parser.parseString(xmlContent, function (err, result) {
				folderUri = config.AGGREGATE_ROOT_URI + '/' + key.replace(/^[a-z]:\\/ig, '').replace(/\\/ig, '/').replace(/ /ig, '%20');
				db.run(sqlStringForMovies(), sqlParamsForMovies(result.movie, key, folderUri, isnew));
			});
		}
		
	});
}

function createFreshDB() {
	fs.unlinkSync(path.join(__dirname, '../db/db.sqlite'));
	debug('Creating Database...');
	var schema = fs.readFileSync(path.join(__dirname, '../schemas/db-structure.sql'), 'utf-8');
	db = new sqlite3.Database(path.join(__dirname, '../db/db.sqlite'), function() {
		db.exec(schema, function() {
			debug('Database Created.');
			debug('Starting Transaction...');
			db.run('BEGIN;');
			parseMovies(config.NEW_MOVIES_ROOT, true);
			parseMovies(config.MOVIES_ROOT, false);
			db.run('COMMIT;');
			debug('Transaction Commited');
			db.run('VACUUM;');
		});
	});
}

function aggregate(deleteDB) {
	if (deleteDB === true) {
		createFreshDB();
	} else {
		db = new sqlite3.Database(path.join(__dirname, '../db/db.sqlite'), function() {
			debug('Starting Transaction...');
			db.run('BEGIN;');
			parseMovies(config.NEW_MOVIES_ROOT, true);
			parseMovies(config.MOVIES_ROOT, false);
			db.run('COMMIT;');
			debug('Transaction Commited');
			db.run('VACUUM;');
		});
	}
	
}

module.exports = aggregate;
