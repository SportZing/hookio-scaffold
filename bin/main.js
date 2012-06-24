#!/usr/bin/env node

var path      = require('path');
var program   = require('commander');
var scaffold  = require('../lib');
var output    = require('./output');

// Handle Error Outputting
process.on('uncaughtException', function(err) {
	if (err instanceof Error) {
		err = (program.stack)
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
			if (err) {
				output.log('');
				throw err;
			}
			output.log(' Done.'.blue);
		});
	});

// Define the start command
program
	.command('start')
	.description('Start the project hooks')
	.action(function() {
		parseOptions();
		output.log.nolf('Starting the application...');
		scaffold.start(getProjectRoot(), function(err, project) {
			if (err) {
				output.log('');
				throw err;
			}
			output.log((' Project running at PID ' + project.conf.pid + '.').blue);
		});
	});

// Define the stop command
program
	.command('stop')
	.description('Stop the project hooks')
	.action(function() {
		parseOptions();
		output.log.nolf('Stopping the application...');
		scaffold.stop(getProjectRoot(), function(err, project) {
			if (err) {
				output.log('');
				throw err;
			}
			output.log(' Done.'.blue);
		});
	});

// Define the restart command
program
	.command('restart')
	.description('Restart the project hooks')
	.action(function() {
		parseOptions();
		output.log.nolf('Restarting the application...');
		scaffold.restart(getProjectRoot(), function(err, project) {
			if (err) {
				output.log('');
				throw err;
			}
			output.log((' Project running at PID ' + project.conf.pid + '.').blue);
		});
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
	output.conf.colors = program.color;
}

