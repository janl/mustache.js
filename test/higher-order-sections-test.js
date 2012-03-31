/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Higher order sections', {
		// FIXME [Morgan Roderick]: this is difficult to describe, perhaps this should be split into two tests?
	    'should do something': function(){
			var template = '{{#bolder}}Hi {{name}}.{{/bolder}}',
				view = {
					"name": "Tater",
					"helper": "To tinker?",
					"bolder": function() {
						return function(text, render) {
							return "<b>" + render(text) + '</b> ' + this.helper;
						};
					}
				},
				expectedResult = '<b>Hi Tater.</b> To tinker?',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
