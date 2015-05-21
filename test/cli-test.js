require('./helper');

var fs = require('fs');
var path = require('path');
var _files = path.join(__dirname, '_files');
var cliTxt = path.resolve(_files, 'cli.txt');
var moduleVersion = require('../package').version;

var exec = require('child_process').exec;

describe('Mustache CLI', function () {

  var expectedOutput;

  before(function(done) {
    fs.readFile(cliTxt, function onFsEnd(err, data) {
      if (err) return done(err);

      expectedOutput = data.toString();
      done();
    });
  });

  it('writes syntax hints into stderr when runned with wrong number of arguments', function(done) {
    exec('bin/mustache', function(err, stdout, stderr) {
      assert.notEqual(stderr.indexOf('Syntax'), -1);
      done();
    });
  });

  it('writes hints about JSON parsing errors when given invalid JSON', function(done) {
    exec('echo {name:"lebron"} | bin/mustache - test/_files/cli.mustache', function(err, stdout, stderr) {
      assert.notEqual(stderr.indexOf('Shooot, could not parse view as JSON'), -1);
      done();
    });
  });

  it('writes module version into stdout when runned with --version', function(done){
    exec('bin/mustache --version', function(err, stdout, stderr) {
      assert.notEqual(stdout.indexOf(moduleVersion), -1);
      done();
    });
  });

  it('writes module version into stdout when runned with -v', function(done){
    exec('bin/mustache -v', function(err, stdout, stderr) {
      assert.notEqual(stdout.indexOf(moduleVersion), -1);
      done();
    });
  });

  it('writes rendered template into stdout when successfull', function(done) {
    exec('bin/mustache test/_files/cli.json test/_files/cli.mustache', function(err, stdout, stderr) {
      assert.equal(err, null);
      assert.equal(stderr, '');
      assert.equal(stdout, expectedOutput);
      done();
    });
  });

  it('reads view data from stdin when first argument equals "-"', function(done){
    exec('cat test/_files/cli.json | bin/mustache - test/_files/cli.mustache', function(err, stdout, stderr) {
      assert.equal(err, null);
      assert.equal(stderr, '');
      assert.equal(stdout, expectedOutput);
      done();
    });
  });

  it('writes it couldnt find template into stderr when second argument doesnt resolve to a file', function(done) {
    exec('bin/mustache test/_files/cli.json test/_files/non-existing-template.mustache', function(err, stdout, stderr) {
      assert.notEqual(stderr.indexOf('Could not find file: test/_files/non-existing-template.mustache'), -1);
      done();
    });
  });

  it('writes it couldnt find view into stderr when first argument doesnt resolve to a file', function(done) {
    exec('bin/mustache test/_files/non-existing-view.json test/_files/cli.mustache', function(err, stdout, stderr) {
      assert.notEqual(stderr.indexOf('Could not find file: test/_files/non-existing-view.json'), -1);
      done();
    });
  });

});
