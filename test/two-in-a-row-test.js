/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Two in a row', {
	    'should be able to render two values in a row': function(){
			var template = '{{greeting}}, {{name}}!',
				view = {
					name: "Joe",
					greeting: "Welcome"
				},
				expectedResult = 'Welcome, Joe!',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
