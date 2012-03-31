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

	buster.testCase('Partial - empty', {
	    'should not generate any output for empty partials': function(){
			var template = 'hey {{foo}}\n{{>partial}}',
				partial = '',
				view = {
					  foo : 1
				},
				expectedResult = 'hey 1\n',
				actualResult = Mustache.to_html( template, view, { partial : partial } );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));