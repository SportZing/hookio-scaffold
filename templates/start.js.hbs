#!/usr/bin/env node

var cp    = require('child_process');
var path  = require('path');

// A list of all spawned processes
var processes = [ ];

// First, we spawn the core
spawn('core.js', function() {

	// Then spawn the various child hooks (after waiting a little while
	// to make sure the core hook has started..)
	var confFile = path.join(__dirname, 'hios.json');
	require(confFile).hooks.forEach(
		function(hook) {
			spawn(hook + '/bin/' + hook + '.js');
		}
	);

});

// Make sure we clean up when exiting
process.on('SIGTERM', function() {
	processes.forEach(function(proc) {
		proc.kill(0);
	});
});

// Spawns a new process
function spawn(bin, outputCallback) {
	var proc = cp.spawn(path.join(__dirname, bin));
	if (outputCallback) {
		var callback = outputCallback;
		outputCallback = function() {
			callback();
			callback = null;
			outputCallback = function() { };
		};
		proc.stdout.once('data', function() {
			outputCallback();
		});
		proc.stderr.once('data', function() {
			outputCallback();
		});
	}
	proc.stdout.on('data', function(data) {
		process.stdout.write(data);
	});
	proc.stderr.on('data', function(data) {
		process.stderr.write(data);
	});
	processes.push(proc);
}

