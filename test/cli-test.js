require('./helper');

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var _files = path.join(__dirname, '_files');
var cliTxt = path.resolve(_files, 'cli.txt');
var cliPartialsTxt = path.resolve(_files, 'cli_with_partials.txt');
var moduleVersion = require('../package').version;

function changeForOS(command) {

  if(process.platform === 'win32') {
    return command
      .replace(/bin\/mustache/g, 'node bin\\mustache')
      .replace(/\bcat\b/g, 'type')
      .replace(/\//g, '\\');
  }

  return command;
}

function exec() {
  arguments[0] = changeForOS(arguments[0]);
  return child_process.exec.apply(child_process, arguments);
}

describe('Mustache CLI', function () {

  var expectedOutput;

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

  describe("without partials", function(){
    before(function(done) {
      fs.readFile(cliTxt, function onFsEnd(err, data) {
        if (err) return done(err);

        expectedOutput = data.toString();
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

    it('writes rendered template into the file specified by the third argument', function(done) {
      var outputFile = 'test/_files/cli_output.txt';
      exec('bin/mustache test/_files/cli.json test/_files/cli.mustache ' + outputFile, function(err, stdout, stderr) {
        assert.equal(err, null);
        assert.equal(stderr, '');
        assert.equal(stdout, '');
        assert.equal(fs.readFileSync(outputFile), expectedOutput);
        fs.unlink('test/_files/cli_output.txt');
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
        assert.isOk(/Could not find file: .+non-existing-template\.mustache/.test(stderr));
        done();
      });
    });

    it('writes it couldnt find view into stderr when first argument doesnt resolve to a file', function(done) {
      exec('bin/mustache test/_files/non-existing-view.json test/_files/cli.mustache', function(err, stdout, stderr) {
        assert.isOk(/Could not find file: .+non-existing-view\.json/.test(stderr));
        done();
      });
    });
  });


  describe("with partials", function(){
    before(function(done) {
      fs.readFile(cliPartialsTxt, function onFsEnd(err, data) {
        if (err) return done(err);

        expectedOutput = data.toString();
        done();
      });
    });

    it('writes rendered template with partials into stdout', function(done) {
      exec('bin/mustache test/_files/cli_with_partials.json test/_files/cli_with_partials.mustache -p test/_files/cli.mustache -p test/_files/comments.mustache', function(err, stdout, stderr) {
        assert.equal(err, null);
        assert.equal(stderr, '');
        assert.equal(stdout, expectedOutput);
        done();
      });
    });

    it('writes rendered template with partials when partials args before required args', function(done) {
      exec('bin/mustache -p test/_files/cli.mustache -p test/_files/comments.mustache test/_files/cli_with_partials.json test/_files/cli_with_partials.mustache', function(err, stdout, stderr) {
        assert.equal(err, null);
        assert.equal(stderr, '');
        assert.equal(stdout, expectedOutput);
        done();
      });
    });
  })
});
