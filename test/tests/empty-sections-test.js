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

	buster.testCase('Empty sections', {
	    'should empty sections should generate no output': function(){
			var template = '{{#foo}}{{/foo}}moo{{#bar}}{{/bar}}',
				view = {},
				expectedResult = 'moo',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));