/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Nested iterating', {
		'should be able to iterate nested collections': function(){
			var template = '{{#inner}}{{foo}}{{#inner}}{{bar}}{{/inner}}{{/inner}}',
				view = {
					inner: [{
						foo: 'foo',
						inner: [{
							bar: 'bar'
						}]
					}]
				},
				expectedResult = 'foobar',
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}());