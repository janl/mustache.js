/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Context lookup', {
	    'should be able to navigate contexts': function(){
			var template = '{{#outer}}{{#second}}{{id}}{{/second}}{{/outer}}',
				view = {
					outer : {
						id: 1,
					    second : {
							nothing: 2
						}
					}					
				},
				expectedResult = '1',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
