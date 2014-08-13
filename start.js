try {
	var config = require('./config.json');
} catch (e) {
	var error = "========== MyFlix-API-INIT ERROR ==========\n";
	if (e.code === 'MODULE_NOT_FOUND') {
		error += "The configuration file (config.json) does not exists.\n";
		error += "Rename config.json.sample to config.json and run the app again.\n";
	} else {
		error += "The configuration file (config.json) contains error(s):\n\n";
		error += e + "\n\n";
		error += "Please correct the error(s) and run the app again.\n";
	}
	error += "Exiting...\n";
	error += "===========================";
	console.error(error);
	process.exit();
}

process.env.NODE_ENV = config.NODE_ENV;
process.env.DEBUG = config.DEBUG;

var fs = require('fs');
var path = require('path');
var sqlite3 = require('sqlite3');
var debug = require('debug')('MyFlix-API-INIT');
var serve = require('./lib/serve');
var aggregate = require('./lib/aggregate');

var db = new sqlite3.cached.Database(path.join(__dirname, './db/db.sqlite'), function() {
	db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="movies";', function(err, rows) {
		if (rows.length > 0) {
			if (process.argv[2] === 'aggregate') {
				db.close(function() {
					aggregate(true);
				});
			} else {
				serve(db, config);
			}
		} else {
			debug('Creating Database...');
			fs.readFile(path.join(__dirname, './schemas/db-structure.sql'), 'utf-8', function (err, data) {
				db.exec(data, function() {
					debug('Database created.');
					if (process.argv[2] === 'aggregate') {
						db.close(function() {
							aggregate(false);
						});
					} else {
						serve(db, config);
					}
				});
			});
		}
	});

});


