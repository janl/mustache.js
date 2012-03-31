/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Partial array', {
		'should do something': function(){
			var template = '{{>partial}}',
				partial = [
					"Here's a non-sense array of values",
					"{{#array}}",
					"  {{.}}",
					"{{/array}}"
				].join('\n'),
				view = {
					array: ['1', '2', '3', '4']
				},
				expectedResult = 
					"Here's a non-sense array of values\n" +
					"  1\n" +
					"  2\n" +
					"  3\n" +
					"  4\n"
				,
				actualResult = Mustache.to_html( template, view, { partial : partial } );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}());