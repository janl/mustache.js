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

	buster.testCase('Single pass rendering', {
	    'should only do one pass through the template': function(){
			var template = '{{#foo}}{{bar}}{{/foo}}',
				view = {
				  foo: true,
				  bar: "{{win}}",
				  win: "FAIL"
				},
				expectedResult = '{{win}}',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));