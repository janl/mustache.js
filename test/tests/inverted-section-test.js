/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	'use strict';
	
	var Mustache = global.Mustache || require("../../mustache");

	buster.testCase('Inverted section', {
		// FIXME [Morgan Roderick]: split this into three different tests
	    'should generate output for inverted sections': function(){
			var template = [
					'{{#repos}}<b>{{name}}</b>{{/repos}}',
					'{{^repos}}No repos :({{/repos}}',
					'{{^nothin}}Hello!{{/nothin}}'
				].join('\n'),
				view = {
					repos : []					
				},
				expectedResult = [
					'',
					'No repos :(',
					'Hello!'
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));