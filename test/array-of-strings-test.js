/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	"use strict";
	
	var Mustache = global.Mustache || require("../mustache");
	
	buster.testCase("Array of strings", {
	    "should be able to accept an array of strings as a collection": function(){
			var template = '{{#array_of_strings}}{{.}} {{/array_of_strings}}',
				view = {
					array_of_strings: ['hello', 'world']
				},
				expectedResult = 'hello world ',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));