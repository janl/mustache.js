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

	buster.testCase('Empty string', {
	    'should not generate any output for empty strings': function(){
			var template = '{{description}}{{#child}}{{description}}{{/child}}',
				view = {
				  description: "That is all!",
				  child: {
				    description: ""
				  }
				},
				expectedResult = 'That is all!',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));