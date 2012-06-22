#!/usr/bin/env node

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

// Define the create-hook command
program
	.command('create-hook <name>')
	.description('Create a new hook')
	.action(function(hookName) {
		parseOptions();
		output.log('Creating hook "' + hookName + '"...');
		scaffold.createHook(hookName, process.cwd(), function(err) {
			if (err) {throw err;}
			output.log('Hook created successfully.'.green);
		});
	});

// Go..
program.parse(process.argv);











// ------------------------------------------------------------------

function parseOptions() {
	output.conf.silent = program.quiet;
	output.conf.colors = program.colors;
}

