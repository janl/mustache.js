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

	buster.testCase('Unescaped', {
		'should allow unescaped output when the unescaped delimiter is used': function(){
			var template = '<h1>{{{title}}}</h1>',
				view = {
					title : function(){
						return "Bear > Shark";
					}
				},
				expectedResult = '<h1>Bear > Shark</h1>',
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));