/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Error not found', {
	    'should not generate error when delimiters cannot be matched to data': function(){
			var template = '{{foo}}',
				view = {
					bar: 2
				},
				expectedResult = '',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
