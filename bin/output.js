
var util   = require('util');
var colors = require('colors');

var conf = exports.conf = {
	colors: true,
	silent: false
};

exports.log = function() {
	var str = format(arguments);
	output('log', str);
};

exports.warn = function() {
	var str = format(arguments);
	if (conf.colors) {
		str = str.yellow;
	}
	output('warn', str);
};

exports.error = function(what) {
	var str = format(arguments);
	if (conf.colors) {
		str = str.red;
	}
	output('error', str);
};

function output(type, what) {
	if (! conf.silent) {
		console[type](what);
	}
}

function format(args) {
	return util.format.apply(util, args);
}

