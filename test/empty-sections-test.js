/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Empty sections', {
	    'should empty sections should generate no output': function(){
			var template = '{{#foo}}{{/foo}}moo{{#bar}}{{/bar}}',
				view = {},
				expectedResult = 'moo',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
