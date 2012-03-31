/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Empty template', {
	    'should not modify output when template has no delimiters': function(){
			var template = '<html><head></head><body><h1>Test</h1></body></html>',
				view = {},
				expectedResult = '<html><head></head><body><h1>Test</h1></body></html>',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
