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

	buster.testCase('Multiline comment', {
	    'should do something': function(){
			var template = [
					'{{!',
					'',
					'This is a multi-line comment.',
					'',
					'}}',
					'Hello world!'
				].join('\n'),
				view = {},
				expectedResult = 'Hello world!',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));