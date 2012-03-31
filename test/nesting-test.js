/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	'use strict';
	
	var Mustache = global.Mustache || require("../mustache");

	buster.testCase('Nesting', {
		'should be able to process nested data in view': function(){
			var template = '{{#foo}}{{#a}}{{b}}{{/a}}{{/foo}}',
				view = {
					foo: [
						{ a : { b : 1 } },
						{ a : { b : 2 } },
						{ a : { b : 3 } }
					]
				},
				expectedResult = '123',
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));