/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	"use strict";
	
	var buster = global.buster || require('buster');
	var Mustache = global.Mustache || require("../../mustache");
	
	buster.testCase("Apostrophe", {
	    "should replace apostrophe with decimal entitiy": function(){
			var template = '{{apos}}{{control}}',
				view = {
					'apos': "'",
					'control':'X'
				},
				expectedResult = '&#39;X',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));