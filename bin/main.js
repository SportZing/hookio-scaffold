#!/usr/bin/env node

var path      = require('path');
var program   = require('commander');
var scaffold  = require('../lib');
var output    = require('./output');

// Handle Error Outputting
process.on('uncaughtException', function(err) {
	if (err instanceof Error) {
		err = 1//(program.stack)
			? err.stack
			: err.name + ': ' + err.message;
	}
	output.error(String(err));
	process.exit(1);
});

// Define the basic options
program
	.version(require('../package.json').version)
	.option('-q, --quiet', 'No output')
	.option('-C, --no-color', 'No color output')
	.option('-s, --stack', 'Output stack trace with error messages');

// Define the init command
program
	.command('init')
	.description('Create a new Hook.io project')
	.action(function() {
		parseOptions();
		output.log.nolf('Creating Hook.io project...');
		scaffold.init(process.cwd(), function(err) {
			if (err) {
				output.log('');
				throw err;
			}
			output.log(' Done.'.blue);
		});
	});

// Define the create-hook command
program
	.command('create-hook <name>')
	.description('Create a new hook')
	.action(function(hookName) {
		parseOptions();
		output.log.nolf('Creating hook "' + hookName + '"...');
		scaffold.createHook(getProjectRoot(), hookName, function(err) {
			if (err) {throw err;}
			output.log(' Done.'.blue);
		});
	});

// Define the start command
program
	.command('start')
	.description('Start the project hooks')
	.action(function() {
		parseOptions();
		
	});

// Go..
program.parse(process.argv);











// ------------------------------------------------------------------

function getProjectRoot() {
	return findUpTree(process.cwd(), 'hios.json');
}

function findUpTree(current, find) {
	var file = path.join(current, find);
	if (path.existsSync(file)) {
		return current;
	}
	if (current === '/') {
		return null;
	}
	current = path.join(current, '..');
	return findUpTree(current, find);
}

function parseOptions() {
	output.conf.silent = program.quiet;
	output.conf.colors = program.colors;
}

