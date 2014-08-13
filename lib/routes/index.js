var debug = require('debug')('MyFlix-API:Index');

var index = {};

index.index = function(req, res) {
	debug('Root Index');
	res.send('[]');
};

index.clearCache = function(req, res, cache) {
	debug('Clear Cache');
	cache.flushAll();
	res.send('[]');
};

module.exports = index;
