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
}(this));