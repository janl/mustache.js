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

	buster.testCase('Two unused sections', {
	    'should not leave artefacts in output': function(){
			var template = [
					'{{#foo}}{{/foo}}',
					'{{#bar}}{{/bar}}'
				].join(''),
				view = {},
				expectedResult = '',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));