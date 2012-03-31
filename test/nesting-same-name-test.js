/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Nesting same name', {
	    'should be able to differentiate between same names in different contexts': function(){
			var template = '{{#items}}{{name}}{{#items}}{{.}}{{/items}}{{/items}}',
				view = {
					items: [
						{
							name: 'name',
							items: [1, 2, 3, 4]
						}
					]
				},
				expectedResult = 'name1234',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
