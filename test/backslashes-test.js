/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	"use strict";
	
	buster.testCase("Backslashes", {
	    "should not destroy backslashes": function(){
			var template = [
				'* {{value}}',
				'* {{{value}}}',
				'* {{&value}}',
				'<script>',
				'foo = { bar: \'abc\\"xyz\\"\' };',
				'foo = { bar: \'x\\\'y\' };',
				'</script>'
				].join('\n'),
				view = {
					value: "\\abc"
				},
				expectedResult = [
					'* \\abc',
					'* \\abc',
					'* \\abc',
					'<script>',
					'foo = { bar: \'abc\\"xyz\\"\' };',
					'foo = { bar: \'x\\\'y\' };',
					'</script>'
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());
