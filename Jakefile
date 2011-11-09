var fs = require('fs'),
	sys = require('sys'),
	util = require('util'),
	uglify = require('uglify-js');

function copyFile(src, dst, cb) {
	function copy(err) {
		var is, os;

		if (!err) {
			return cb(new Error("File " + dst + " exists."));
		}

		fs.stat(src, function (err) {
			if (err) {
				return cb(err);
			}
			
			is = fs.createReadStream(src);
			os = fs.createWriteStream(dst);
			util.pump(is, os, cb);
		});
	}

	fs.stat(dst, copy);
}
  
function makeDirectoryIfNotExists(path) {
	try {
		var stats = fs.statSync(path);	
		if (!stats.isDirectory()) {
			fs.mkdirSync(path, 0);
		}
	} catch (e) {
		fs.mkdirSync(path, 0);
	}
}

desc('Obfuscation and Compression');
task('minify', function() {
	var all = fs.readFileSync('mustache.js').toString(),
		out = fs.openSync('mustache.min.js', 'w+'),
		ast = uglify.parser.parse(all);

	ast = uglify.uglify.ast_mangle(ast);
	ast = uglify.uglify.ast_squeeze(ast);

	fs.writeSync(out, uglify.uglify.gen_code(ast));
});

task('package', function() {
	function package(id, location) {
		var files = [
			, 'mustache.js'
		];

		files.unshift('mustache-' + id + '/mustache.js.tpl.pre');
		files.push('mustache-' + id + '/mustache.js.tpl.post');

		var all = '';
		files.forEach(function(file, i) {
			all += fs.readFileSync(file).toString();
			all += '\n';
		});
		
		var outPath;
		if (location) {
			makeDirectoryIfNotExists('packages/' + id);
			
			if (location === true) {
				outPath = 'packages/' + id + '/mustache.js';
			} else {
				outPath = 'packages/' + id + '/' + location + '/mustache.js';			
				
				makeDirectoryIfNotExists('packages/' + id + '/' + location);
			}
		} else {
			outPath = 'packages/' + id + '.mustache.js';
		}
		var out = fs.openSync(outPath, 'w+');
		fs.writeSync(out, all);		
	}
	
	var params = Array.prototype.slice.call(arguments);
	
	makeDirectoryIfNotExists('packages');
	
	for (var i = 0, n = params.length; i<n; ++i) {
		switch (params[i].toLowerCase()) {
			case 'jquery':
				package('jquery');
				break;
			case 'commonjs':
				package('commonjs', true);
				copyFile('mustache-commonjs/package.json', 'packages/commonjs/package.json');
				break;
			case 'dojox':
				package('dojox', 'string');
				break;
			case 'yui3':
				package('yui3', 'mustache');
				break;
			case 'requirejs':
				package('requirejs');
				break;
			default:
				break;
		}
	}
});