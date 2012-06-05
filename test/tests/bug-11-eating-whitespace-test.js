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
	
	buster.testCase("Bug 11 - Eating whitespace", {
	    "should do something": function(){
			var template = '{{tag}} foo',
				view = {
					tag: "yo"
				},
				expectedResult = 'yo foo',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));