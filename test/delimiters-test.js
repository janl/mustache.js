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

	buster.testCase('Delimiters', {
		'should do something': function(){
			var template = [
					'{{=<% %>=}}* <% first %>',
					'* <% second %>',
					'<%=| |=%>* | third |',
					'|={{ }}=|* {{ fourth }}'
				].join('\n'),
				view = {
					first: 'It worked the first time.',
					second: 'And it worked the second time.',
					third: 'Then, surprisingly, it worked the third time.',
					fourth: 'Fourth time also fine!.'
				},
				expectedResult = [
					'* It worked the first time.',
					'* And it worked the second time.',
					'* Then, surprisingly, it worked the third time.',
					'* Fourth time also fine!.'
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));