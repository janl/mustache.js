/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	'use strict';
	
	var Mustache = global.Mustache || require("../../mustache");

	buster.testCase('Whitespace', {
		'should preserve whitespace': function(){
			var template = [
					'{{tag1}}',
					'',
					'',
					'{{tag2}}.'				
				].join('\n'),
				view = {
					tag1 : "Hello",
					tag2 : "World"
				},
				expectedResult = [
					'Hello',
					'',
					'',
					'World.'
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));