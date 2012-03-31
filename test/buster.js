/*jslint white:true, plusplus:true */
/*global
	module
*/
var config = module.exports;

config["mustache.js - V8"] = {
    rootPath: "../",
    environment: "node",
    sources: [
        "mustache.js"
    ],
    tests: [
        "test/tests/*-test.js"
    ]
};

config["mustache.js - Browser"] = {
    rootPath: "../",
    environment: "browser",
    sources: [
        "mustache.js"
    ],
    tests: [
        "test/tests/*-test.js"
    ]
};