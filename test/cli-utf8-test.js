require('./helper');

var fs = require('fs');
var os = require('os');
var path = require('path');
var childProcess = require('child_process');

function renderFiles (view, template, partial, expected, done) {
  var directory = path.join(os.tmpdir(), 'mustache-utf8-' + process.pid + '-' + Math.random().toString(16).slice(2));
  fs.mkdirSync(directory);
  var viewPath = path.join(directory, 'view.json');
  var templatePath = path.join(directory, 'template.mustache');
  var partialPath = path.join(directory, 'utf8.mustache');
  fs.writeFileSync(viewPath, view);
  fs.writeFileSync(templatePath, template);
  var args = isLegacyNodeVersion ? [] : ['--require', 'esm'];
  args = args.concat(['bin/mustache', viewPath, templatePath]);
  if (partial !== undefined) {
    fs.writeFileSync(partialPath, partial);
    args = args.concat(['-p', partialPath]);
  }
  childProcess.execFile(process.execPath, args, { maxBuffer: 1024 * 1024 }, function onRendered (error, stdout, stderr) {
    fs.unlinkSync(viewPath);
    fs.unlinkSync(templatePath);
    if (partial !== undefined) fs.unlinkSync(partialPath);
    fs.rmdirSync(directory);
    assert.equal(error, null);
    assert.equal(stderr, '');
    assert.equal(stdout.slice(-2), expected.slice(-2));
    assert.isTrue(stdout === expected, 'preserves the complete UTF-8 string');
    done();
  });
}

describe('Mustache CLI UTF-8 decoding', function () {
  it('preserves a template character split between stream chunks', function (done) {
    var text = new Array(65536).join('a') + '€X';
    renderFiles('{}', text, undefined, text, done);
  });

  it('preserves a JSON view character split between stream chunks', function (done) {
    var prefixLength = 65535 - '{"value":"'.length;
    var text = new Array(prefixLength + 1).join('a') + '€X';
    renderFiles(JSON.stringify({ value: text }), '{{value}}', undefined, text, done);
  });

  it('preserves a partial character split between stream chunks', function (done) {
    var text = new Array(65536).join('a') + '€X';
    renderFiles('{}', '{{>utf8}}', text, text, done);
  });
});
