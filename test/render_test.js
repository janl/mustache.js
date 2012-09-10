var fs = require("fs");
var path = require("path");
var assert = require("assert");
var vows = require("vows");
var Mustache = require("./../mustache");

var _files = path.join(__dirname, "_files");

function getContents(testName, ext) {
  return fs.readFileSync(path.join(_files, testName + "." + ext), "utf8");
}

// You can put the name of a specific test to run in the TEST environment
// variable (e.g. TEST=backslashes vows test/render_test.js)
var testToRun = process.env["TEST"];

var testNames;
if (testToRun) {
  testNames = [testToRun];
} else {
  testNames = fs.readdirSync(_files).filter(function (file) {
    return (/\.js$/).test(file);
  }).map(function (file) {
    return path.basename(file).replace(/\.js$/, "");
  });
}

var spec = {};

testNames.forEach(function (testName) {
  var view = getContents(testName, "js");

  if (view) {
    view = eval(view);
  } else {
    console.log("Cannot find view for test: " + testName);
    process.exit();
  }

  var template = getContents(testName, "mustache");
  var expect = getContents(testName, "txt");

  var partial;
  try {
    partial = getContents(testName, "partial");
  } catch (e) {
    // No big deal.
  }

  spec["knows how to render " + testName] = function () {
    Mustache.clearCache();

    var output;
    if (partial) {
      output = Mustache.render(template, view, {partial: partial});
    } else {
      output = Mustache.render(template, view);
    }

    assert.equal(output, expect);
  };
});

vows.describe("Mustache.render").addBatch({
  "render": spec
}).export(module);
