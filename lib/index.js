
var fs          = require('fs');
var path        = require('path');
var async       = require('async');
var handlebars  = require('handlebars');

var createHookBin = fileCreator('bin');
var createHookLib = fileCreator('lib');

exports.createHook = function createHook(hookName, projectRoot, callback) {
	var hookPath = path.join(projectRoot, hookName);
	path.exists(hookPath, function(exists) {
		if (exists) {
			return callback('Path "' + hookPath + '" already exists.');
		}
		fs.mkdir(hookPath, 0777, function(err) {
			if (err) {
				return callback(err);
			}
			async.parallel([
				createHookBin(hookName, hookPath),
				createHookLib(hookName, hookPath)
			], callback);
		});
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

