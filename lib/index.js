
var fs          = require('fs');
var path        = require('path');
var async       = require('async');
var handlebars  = require('handlebars');
var spawn       = require('child_process').spawn;
var ansiparse   = require('ansiparse');

var createHookLib = fileCreator('lib');
var createHookBin = fileCreator('bin', 0755);

exports.init = function(projectRoot, callback) {
	var project = new Project(projectRoot);
	project.writeConfig({ hooks: [ ] }, function(err) {
		if (err) {
			return callback(err);
		}
		async.series([
			function(done) {
				fs.mkdir(project.pathTo('logs'), 0755, done);
			},
			function(done) {
				copy('core.js', project.pathTo('core.js'), 0755, done);
			},
			function(done) {
				copy('start.js', project.pathTo('start.js'), 0755, done);
			}
		], callback);
	});
};

exports.createHook = function(projectRoot, hookName, callback) {
	var project = new Project(projectRoot);
	return project.createHook(hookName, callback);
};

exports.disableHook = function(projectRoot, hookName, callback) {
	var project = new Project(projectRoot);
	return project.disableHook(hookName, callback);
};

exports.enableHook = function(projectRoot, hookName, callback) {
	var project = new Project(projectRoot);
	return project.enableHook(hookName, callback);
};

exports.start = function(projectRoot, callback) {
	var project = new Project(projectRoot);
	project.start(function(err) {
		if (err) {
			return callback(err);
		}
		callback(null, project);
	});
};

exports.stop = function(projectRoot, callback) {
	var project = new Project(projectRoot);
	project.stop(function(err) {
		if (err) {
			return callback(err);
		}
		callback(null, project);
	});
};

exports.restart = function(projectRoot, callback) {
	var project = new Project(projectRoot);
	project.restart(function(err) {
		if (err) {
			return callback(err);
		}
		callback(null, project);
	});
};

// ------------------------------------------------------------------

function fileCreator(file, perms) {
	return function(hookName, hookPath) {
		var dirPath = path.join(hookPath, file);
		var filePath = path.join(dirPath, hookName + '.js');
		return function(done) {
			fs.mkdir(dirPath, 0755, function(err) {
				if (err) {return done(err);}
				render(file + '.js', hookName, function(err, content) {
					if (err) {return done(err);}
					fs.writeFile(filePath, content, function(err) {
						if (err) {
							return done(err);
						}
						if (perms) {
							fs.chmod(filePath, perms, done);
						} else {
							done(null);
						}
					});
				});
			});
		};
	};
}

// ------------------------------------------------------------------
//  Project constructor

exports.Project = Project;
function Project(projectRoot) {
	this.root       = projectRoot;
	this.conf       = null;
	this.confFile   = this.pathTo('hios.json');
	this.logDir     = this.pathTo('logs');
	this.logs       = {
		output: this.openLogFile('output.log'),
		error: this.openLogFile('error.log')
	};
}

Project.prototype.pathTo = function(file) {
	return path.join(this.root, file);
};

Project.prototype.openLogFile = function(file) {
	if (path.existsSync(this.logDir)) {
		file = path.join(this.logDir, file);
		return fs.createWriteStream(file, { flags: 'a+' });
	}
};

Project.prototype.logWriter = function(file) {
	return (
		function(data) {
			this.logs[file].write(data + '\n');
		}.bind(this)
	);
};

Project.prototype.readConfig = function(callback) {
	path.exists(this.confFile, function(exists) {
		if (! exists) {
			return callback('Configuration file does not exists');
		}
		fs.readFile(this.confFile, 'utf8', function(err, json) {
			if (err) {
				return callback(err);
			}
			try {
				var conf = JSON.parse(json);
			} catch (e) {
				return callback(e);
			}
			conf.hooks = conf.hooks || [ ];
			conf.disabled = conf.disabled || [ ];
			this.conf = conf;
			callback(null, conf);
		}.bind(this));
	}.bind(this));
};

Project.prototype.writeConfig = function(conf, callback) {
	fs.writeFile(this.confFile, JSON.stringify(conf), callback);
};

Project.prototype.createHook = function(hookName, callback) {
	var hookPath = path.join(this.projectRoot, hookName);
	path.exists(hookPath, function(exists) {
		if (exists) {
			return callback('Path "' + hookPath + '" already exists.');
		}
		fs.mkdir(hookPath, 0755, function(err) {
			if (err) {
				return callback(err);
			}
			
			var conf;
			var readConf = function(done) {
				this.readConfig(function(err, _conf) {
					if (err) {return done(err);}
					conf = _conf;
					done();
				});
			}.bind(this);
			
			async.parallel(
				[
					readConf,
					createHookBin(hookName, hookPath),
					createHookLib(hookName, hookPath)
				],
				function(err) {
					if (err) {
						return callback(err);
					}
					conf.hooks.push(hookName);
					this.writeConfig(conf, callback);
				}.bind(this)
			);
		}.bind(this));
	}.bind(this));
};

Project.prototype.enableHook = function(hookName, callback) {
	this.readConfig(function(err, conf) {
		if (err) {
			return callback(err);
		}
		if (conf.hooks.indexOf(hookName) < 0) {
			return callback('No such hook');
		}
		var index = conf.disabled.indexOf(hookName);
		if (index < 0) {
			return callback('Hook already enabled');
		}
		conf.disabled.splice(index, 1);
		this.writeConfig(conf, callback);
	}.bind(this));
};

Project.prototype.disableHook = function(hookName, callback) {
	this.readConfig(function(err, conf) {
		if (err) {
			return callback(err);
		}
		if (conf.hooks.indexOf(hookName) < 0) {
			return callback('No such hook');
		}
		if (conf.disabled.indexOf(hookName) >= 0) {
			return callback('Hook already disabled');
		}
		conf.disabled.push(hookName);
		this.writeConfig(conf, callback);
	}.bind(this));
};

Project.prototype.start = function(callback) {
	this.readConfig(function(err, conf) {
		if (err) {
			return callback(err);
		}
		
		var bin = path.join(this.root, 'start.js');
		var proc = spawn(bin, [ ], { cwd: this.root });
		
		conf.pid = proc.pid;
		this.writeConfig(conf, function(err) {
			if (err) {
				return callback(err);
			}
		
			// Log stdout
			proc.stdout.on('data', function(data) {
				data = data.toString('utf8');
				process.stdout.write(data);
				this.logs.output.write(stripANSI(data));
			}.bind(this));
			
			// Log stderr
			proc.stderr.on('data', function(data) {
				data = data.toString('utf8');
				process.stderr.write(data);
				this.logs.error.write(stripANSI(data));
			}.bind(this));
		
			proc.on('exit', function() {
				this.logs.output.write('Application shutting down.\n');
			}.bind(this));
			
			callback(null);
		}.bind(this));
		
	}.bind(this));
};

Project.prototype.stop = function(callback) {
	this.readConfig(function(err, conf) {
		if (err) {
			return callback(err);
		}
		if (conf.pid) {
			try {
				process.kill(conf.pid, 'SIGTERM');
			} catch (e) {
				return callback(e);
			}
		}
		conf.pid = null;
		this.writeConfig(conf, callback);
	}.bind(this));
};

Project.prototype.restart = function(callback) {
	this.stop(function(err) {
		if (err) {
			return callback(err);
		}
		this.start(callback);
	}.bind(this));
};

// ------------------------------------------------------------------
//  Template Processesing

function templateData(hookName) {
	return {
		hyphenated: hookName,
		capitalized: hookName.split('-').map(capitalizeWord).join('')
	};
}

function capitalizeWord(str) {
	return str[0].toUpperCase() + str.slice(1);
}

var compileCache = { };
var templates = path.join(__dirname, '../templates');
function compileFile(file, callback) {
	if (! compileCache[file]) {
		fs.readFile(path.join(templates, file + '.hbs'), 'utf8', function(err, data) {
			if (err) {
				return callback(err);
			}
			compileCache[file] = handlebars.compile(data);
			callback(null, compileCache[file]);
		});
	} else {
		callback(null, compileCache[file]);
	}
}

function copy(template, to, perms, callback) {
	render(template, template, function(err, content) {
		fs.writeFile(to, content, function(err) {
			if (err) {
				return done(err);
			}
			fs.chmod(to, perms, callback);
		});
	});
}

function render(file, hookName, callback) {
	compileFile(file, function(err, template) {
		if (err) {
			return callback(err);
		}
		try {
			var result = template(templateData(hookName));
		} catch (e) {
			return callback(e);
		}
		callback(null, result);
	});
}

// ------------------------------------------------------------------

function stripANSI(str) {
	return ansiparse(str).map(
		function(segment) { return segment.text; }
	).join('');
}




