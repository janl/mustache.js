var chai = require('chai');
var isRunningInNode = process !== undefined && process.versions.node !== undefined;

if (isRunningInNode) {
  var nodejsMajorVersion = Number(process.versions.node.split('.')[0]);
  isLegacyNodeVersion = !(nodejsMajorVersion >= 10);

  if (!isLegacyNodeVersion) {
    // The `zuul` package we use to run tests in browsers via Saucelabs eagerly loads all
    // packages it sees being used via `require()`. Because we don't want the `esm` package
    // to be loaded when running browser tests, we refer to `require()` via `module.require()`
    // because that avoid the mentioned eager loading
    module.require = module.require('esm')(module);
  }
}
assert = chai.assert;
chai.should();
Mustache = require('../mustache');
