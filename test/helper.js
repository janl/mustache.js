var chai = require('chai');
var nodejsMajorVersion = Number(process.versions.node.split(".")[0]);

isLegacyNodeVersion = !(nodejsMajorVersion >= 10);

if (!isLegacyNodeVersion) {
  require = require("esm")(module);
}

assert = chai.assert;
chai.should();
Mustache = require('../mustache');
