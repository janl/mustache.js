/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache,
	require
*/
(function(global){
	'use strict';
	
	var Mustache = global.Mustache || require("../mustache");
	
	buster.testCase( 'Changing delimiters', {
	    'should allow alternate set of delimiters': function(){
			var template = '{{=<% %>=}}<% foo %> {{foo}} <%{bar}%> {{{bar}}}',
				view = {
				  foo : 'foooooooooooooo',
				  bar : '<b>bar!</b>'
				},
				expectedResult = 'foooooooooooooo {{foo}} <b>bar!</b> {{{bar}}}',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));