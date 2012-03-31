/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Included tag', {
	    'should allow delimiters to be output, when using unescaped output': function(){
			var template = 'You said "{{{html}}}" today',
				view = {
					html: "I like {{mustache}}"
				},
				expectedResult = 'You said "I like {{mustache}}" today',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
