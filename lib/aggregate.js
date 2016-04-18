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

function sqlParamsForMedia(item, folder, folderUri, isnew, mediaType) {
    //console.log("\n" + mediaType + "\n");
    var customGenre = path.basename(path.join(folder, '../'));
    if (customGenre === 'Whats New') {
        customGenre = '';
    }
    var params = {};
    params.$mediatype = mediaType;
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

    /*
    if (utils.isFile(path.join(folder, params.$title, 'folder.jpg'))) {
    	params.$cover = 'folder.jpg';
    }
    */

    params.$cover = 'folder.jpg';

    /*if (fs.existsSync(path.join(folder, 'folder.jpg'))) {
    	params.$cover = 'folder.jpg';
    }*/

    params.$tagline = item.tagline ? item.tagline[0] : '';
    params.$year = item.year ? item.year[0] : '';
    params.$rating = item.rating ? item.rating[0] : '';
    params.$trailer = item.trailer ? item.trailer.join().trim() : '';
    params.$certification = item.certification ? item.certification[0] : '';
    params.$runtime = item.runtime ? item.runtime[0] : '';
    //params.$genre = item.genre[0] ? ' ' + item.genre[0].name.join().trim() + ' ' : '';
    params.$genre = ' ' + customGenre + ' ';
    params.$actor = item.actor[0] ? ' ' + item.actor[0].name.join().trim() + ' ' : '';
    params.$director = item.director[0] ? ' ' + item.director[0].name.join().trim() + ' ' : '';
    params.$country = item.country[0] ? ' ' + item.country[0].name.join().trim() + ' ' : '';
    params.$studio = item.studio[0] ? ' ' + item.studio[0].name.join().trim() + ' ' : '';
    params.$resolution = item.mediainfo[0].resolution && item.mediainfo[0].resolution.length > 0 ? item.mediainfo[0].resolution[0] : '';
    //params.$hassubtitle = item.mediainfo[0].externalsubtitleslist && item.mediainfo[0].externalsubtitleslist.length > 0 ? 'yes' : 'no' ;
    params.$hassubtitle = 'no';

    if (utils.isFile(path.join(folder, params.$title + '.srt'))) {
        params.$hassubtitle = 'yes';
        if (!utils.isFile(path.join(folder, params.$title + '.vtt'))) {
            debug(utils.logd() + ' Creating WEBVTT subtitle for ' + params.$filename + '...');
            utils.srt2vtt(folder, params.$title);
        }
    }
    /*
    if (fs.existsSync(path.join(folder, params.$title + '.srt'))) {
    	params.$hassubtitle = 'yes';
    	if (!fs.existsSync(path.join(folder, params.$title + '.vtt'))) {
    		utils.srt2vtt(folder, params.$title);
    	}
    }*/
    params.$language = item.mediainfo[0].languages && item.mediainfo[0].languages.length > 0 ? ' ' + utils.arrayUnique(item.mediainfo[0].languages).join().trim() + ' ' : '';
    params.$durationminutes = item.mediainfo[0].durationminutes && item.mediainfo[0].durationminutes.length > 0 ? item.mediainfo[0].durationminutes[0] : '';
    //params.$filesize = item.mediainfo[0].filesize && item.mediainfo[0].filesize.length > 0 ? item.mediainfo[0].filesize[0] : '';
    //params.$filesizebytes = item.mediainfo[0].filesizebytes && item.mediainfo[0].filesizebytes.length > 0 ? item.mediainfo[0].filesizebytes[0] : '';

    params.$filesizebytes = fs.statSync(path.join(params.$folder, params.$filename)).size;
    params.$filesize = utils.formatBytes(params.$filesizebytes);

    params.$isnew = isnew;
    return params;
}

function sqlStringForMedia() {
    if (!sqls.insertMedia) {
        sqls.insertMedia = fs.readFileSync(path.join(__dirname, '../schemas/insert-media.sql'), 'utf-8');
    }
    return sqls.insertMedia;
}

function parseMedia(folder, isnew, mediaType) {
    isnew = isnew === true ? 'yes' : 'no';
    mediaType = mediaType || 'movies';
    var newMedia = utils.dirWalk(folder);
    var mediaName = '';
    var xmlFileName = '';
    var xmlContent = '';
    var parser = new xml2js.Parser({
        trim: true
    });

    var folderUri = '';

    debug(utils.logd() + ' Processing ' + folder + ' ...');
    utils.forEach(newMedia, function (key, item) {
        mediaName = path.basename(key);
        xmlFileName = path.join(key, mediaName + '.xml');

        if (utils.isFile(xmlFileName)) {
            //debug(utils.logd() + ' Aggregating ' + xmlFileName + ' ...');
            xmlContent = fs.readFileSync(xmlFileName, 'utf-8');
            parser.parseString(xmlContent, function (err, result) {
                folderUri = config.AGGREGATE_ROOT_URI + '/' + key.replace(/^[a-z]:\\/ig, '').replace(/\\/ig, '/').replace(/ /ig, '%20');
                db.run(sqlStringForMedia(), sqlParamsForMedia(result.movie, key, folderUri, isnew, mediaType));
            });
        }

    });

    debug(utils.logd() + ' Done processing ' + folder + ' ...');


}

function createFreshDB() {
    fs.unlinkSync(path.join(__dirname, '../db/db.sqlite'));
    debug(utils.logd() + ' Creating Database...');
    var schema = fs.readFileSync(path.join(__dirname, '../schemas/db-structure.sql'), 'utf-8');
    db = new sqlite3.Database(path.join(__dirname, '../db/db.sqlite'), function () {
        db.exec(schema, function () {
            debug(utils.logd() + ' Database Created.');
            debug(utils.logd() + ' Starting Transaction...');
            db.run('BEGIN;');
            parseMedia(config.NEW_MOVIES_ROOT, true, 'movies');
            parseMedia(config.MOVIES_ROOT, false, 'movies');
            parseMedia(config.ANIMATIONS_ROOT, false, 'animations');
            db.run('COMMIT;');
            debug(utils.logd() + ' Transaction Commited');
            debug(utils.logd() + ' Waiting 3 seconds before VACUUM');
            setTimeout(function () {
                db.run('VACUUM;');
                debug(utils.logd() + ' Finished running VACUUM');
            }, 3000);
        });
    });
}

function aggregate(deleteDB) {
    if (deleteDB === true) {
        createFreshDB();
    } else {
        db = new sqlite3.Database(path.join(__dirname, '../db/db.sqlite'), function () {
            debug(utils.logd() + ' Starting Transaction...');
            db.run('BEGIN;');
            parseMedia(config.NEW_MOVIES_ROOT, true, 'movies');
            parseMedia(config.MOVIES_ROOT, false, 'movies');
            parseMedia(config.ANIMATIONS_ROOT, false, 'animtions');
            db.run('COMMIT;');
            debug(utils.logd() + ' Transaction Commited');
            debug(utils.logd() + ' Waiting 3 seconds before VACUUM');
            setTimeout(function () {
                db.run('VACUUM;');
                debug(utils.logd() + ' Finished running VACUUM');
            }, 3000);
        });

    }

}

module.exports = aggregate;