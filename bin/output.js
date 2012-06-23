
var util   = require('util');
var colors = require('colors');

var conf = exports.conf = {
	colors: true,
	silent: false
};

var colors = exports.colors = {
	log: null,
	warn: 'yellow',
	error: 'red'
};

['log', 'warn', 'error'].forEach(function(func) {
	exports[func] = function() {
		output(func, format(func, arguments, '\n'));
	};
	exports[func].nolf = function() {
		output(func, format(func, arguments, ''));
	};
});

function output(type, what) {
	if (! conf.silent) {
		if (type === 'error') {
			process.stderr.write(what);
		} else {
			process.stdout.write(what);
		}
	}
}

function format(type, args, ending) {
	var str = util.format.apply(util, args) + (ending || '');
	if (conf.colors && colors[type]) {
		str = str[colors[type]];
	}
	return str;
}

