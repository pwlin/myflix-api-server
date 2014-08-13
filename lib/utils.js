var fs = require('fs');
var path = require('path');
var util = require('util');
var MD5 = require('MD5');
var prettyjson = require('prettyjson');

function forEach(obj, cb) {
	if (/String|Array/.test(Object.prototype.toString.call(obj))) {
		for (var i = 0, l = obj.length; i < l; i++) {
			if (cb) {
				cb(i, obj[i]);
			}
		}
	} else {
		for (var k in obj) {
			if (obj.hasOwnProperty(k)) {
				if (cb) {
					cb(k, obj[k]);
				}
			}
		}
	}
}

function dirWalk(dir, files_) {
	files_ = files_ || {};
	var files = fs.readdirSync(dir);
	for (var i in files) {
		if (files.hasOwnProperty(i)) {
			var name = path.join(dir, files[i]);
			if (fs.statSync(name).isDirectory()) {
				dirWalk(name, files_);
			} else {
				if (files_[path.dirname(name)]) {
					files_[path.dirname(name)].push(name);
				} else {
					files_[path.dirname(name)] = [];
					files_[path.dirname(name)].push(name);
				}
			}
		}
	}
	return files_;
}

function log(mix) {
	console.log(util.inspect(mix, false, null));
}

function logpj(data, options) {
	options = options || {};
	console.log(prettyjson.render(data, options));
}

function arrayUnique(a) {
	return a.reduce(function(p, c) {
		if (p.indexOf(c) < 0) {
			p.push(c);
		}
		return p;
	}, []);
}

function buildRESTCallback(reqQuery, items) {
	items = items || [];
	if (!reqQuery.callback) {
		return JSON.stringify(items);
	}
	reqQuery.context = reqQuery.context ? '"' + reqQuery.context.replace(/\W+\./g, '') + '", ' : '';
	return reqQuery.callback.replace(/\W+\./g, '') + '(' + reqQuery.context + JSON.stringify(items) + ');';
}

function md5(txt) {
	return MD5(txt);
}

function isEmptyObject(obj) {
	return !Object.keys(obj).length;
}


function mapMovieRows(rows) {
	rows = rows.map(function(item) {
		item.genre = item.genre.trim().split(',');
		item.actor = item.actor.trim().split(',');
		item.director = item.director.trim().split(',');
		item.country = item.country.trim().split(',');
		item.studio = item.studio.trim().split(',');
		item.language = item.language.trim().split(',');
		return item;
	});
	return rows;
}

function encodeFileToBase64(file) {
	return new Buffer(fs.readFileSync(file)).toString('base64');
}


//================== exports 
exports.forEach = forEach;
exports.dirWalk = dirWalk;
exports.log = log;
exports.logpj = logpj;
exports.arrayUnique = arrayUnique;
exports.buildRESTCallback = buildRESTCallback;
exports.md5 = md5;
exports.isEmptyObject = isEmptyObject;
exports.mapMovieRows = mapMovieRows;
exports.encodeFileToBase64 = encodeFileToBase64;

