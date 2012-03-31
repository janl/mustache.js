/*jslint white:true, plusplus:true */
/*global
	module
*/
var config = module.exports;

config["mustache.js"] = {
    rootPath: "../",
    environment: "browser", // or "node"
    sources: [
        "mustache.js"
    ],
    tests: [
        "test/*-test.js"
    ]
};