/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	"use strict";
	
	var buster = global.buster || require('buster');	
	var Mustache = global.Mustache || require("../../mustache");

	buster.testCase("Comments", {
	    "should be removed in output": function(){
			var template = '<h1>{{title}}{{! just something interesting... or not... }}</h1>',
				view = {
				  title: function() {
				    return "A Comedy of Errors";
				  }
				},
				expectedResult = '<h1>A Comedy of Errors</h1>',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));