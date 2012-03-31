/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Disappearing whitespace', {
	    'should keep whitespace after delimiters': function(){
			var template = '{{#bedrooms}}{{total}}{{/bedrooms}} BED',
				view = {
					bedrooms: true,
					total: 1
				},
				expectedResult = '1 BED',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
