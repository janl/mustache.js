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
	
	buster.testCase('Partial - array of partials - implicit', {
	    'should allow the use of partials in sections, also for implicit values': function(){
			var template = [
					'Here is some stuff!',
					'{{#numbers}}',
					'{{>partial}}',
					'{{/numbers}}'
				].join('\n'),
				partial = '{{.}}\n',
				view = {
					numbers: ['1', '2', '3', '4']
				},
				expectedResult =
					'Here is some stuff!\n' +
					'1\n' +
					'2\n' +
					'3\n' +
					'4\n'
				,
				actualResult = Mustache.to_html( template, view, { partial : partial } );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));