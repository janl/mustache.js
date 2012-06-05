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
	
	buster.testCase("Ampersand escape", {
	    "should not html escape when ampersand is used": function(){
			var template = '{{&message}}',
				view = {
					message: "Some <code>"
				},
				expectedResult = 'Some <code>',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));