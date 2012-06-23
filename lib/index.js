
var fs          = require('fs');
var path        = require('path');
var async       = require('async');
var handlebars  = require('handlebars');

var createHookBin = fileCreator('bin');
var createHookLib = fileCreator('lib');

exports.init = function(projectRoot, callback) {
	var project = new Project(projectRoot);
	project.writeConfig({ hooks: [ ] }, function(err) {
		if (err) {
			return callback(err);
		}
		project.createHook('core', function(err) {
			if (err) {
				return callback(err);
			}
			callback(null, project);
		});
	});
};

exports.createHook = function(projectRoot, hookName, callback) {
	var project = new Project(projectRoot);
	return project.createHook(hookName, callback);
};

exports.start = function(projectRoot) {
	var project = new Project(projectRoot);
	project.readConfig(function(err, conf) {
	
	});
};

// ------------------------------------------------------------------

function fileCreator(file) {
	return function(hookName, hookPath) {
		var dirPath = path.join(hookPath, file);
		var filePath = path.join(dirPath, hookName + '.js');
		return function(done) {
			fs.mkdir(dirPath, 0777, function(err) {
				if (err) {return done(err);}
				render(file + '.js', hookName, function(err, content) {
					if (err) {return done(err);}
					fs.writeFile(filePath, content, done);
				});
			});
		};
	};
}

// ------------------------------------------------------------------
//  Project constructor

exports.Project = Project;
function Project(projectRoot) {
	this.root      = projectRoot;
	this.confFile  = path.join(projectRoot, 'hois.json');
}

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
			callback(null, conf);
		});
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
		fs.mkdir(hookPath, 0777, function(err) {
			if (err) {
				return callback(err);
			}
			var conf;
			async.parallel(
				[
					createHookBin(hookName, hookPath),
					createHookLib(hookName, hookPath),
					function(done) {
						this.readConfig(function(err, _conf) {
							if (err) {return done(err);}
							conf = _conf;
							done();
						});
					}.bind(this)
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

Project.prototype.start = function(callback) {
	this.readConfig(function(err, conf) {
		if (err) {
			return callback(err);
		}
		
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

