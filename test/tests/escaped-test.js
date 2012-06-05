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

	buster.testCase('Escaped', {
	    'should html escape unsafe characters, but not entities': function(){
			var template = '<h1>{{title}}</h1>\nBut not {{entities}}.',
				view = {
					title: function() {
						return "Bear > Shark";
					},
					entities: "&quot;"
				},
				expectedResult = '<h1>Bear &gt; Shark</h1>\nBut not &quot;.',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));