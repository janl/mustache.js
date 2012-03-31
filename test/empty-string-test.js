/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Empty string', {
	    'should not generate any output for empty strings': function(){
			var template = '{{description}}{{#child}}{{description}}{{/child}}',
				view = {
				  description: "That is all!",
				  child: {
				    description: ""
				  }
				},
				expectedResult = 'That is all!',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());