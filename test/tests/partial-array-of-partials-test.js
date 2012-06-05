/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	'use strict';
	
	var buster = global.buster || require('buster');	
	var Mustache = global.Mustache || require("../../mustache");

	buster.testCase('Partial - array of partials', {
	    'should allow the use of partials in sections': function(){
			var template = [
					'Here is some stuff!',
					'{{#numbers}}',
					'{{>partial}}',
					'{{/numbers}}'
				].join('\n'),
				partial = '{{i}}\n',
				view = {
					numbers: [
						{ i : '1'},
						{ i : '2'},
						{ i : '3'},
						{ i : '4'}
					]					
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