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

	buster.testCase('Re-use of enumerables', {
		'must not consume data, it should be available to be re-used many times': function(){
			var template = 
					'{{#terms}}{{name}}, {{index}}, {{/terms}}' + '\n' +
					'{{#terms}}{{name}}|{{index}}|{{/terms}}'
				,
				view = {
					terms: [
						{ name: 't1', index: 0 },
						{ name: 't2', index: 1 }
					]
				},
				expectedResult = 
					't1, 0, t2, 1, ' + '\n' +
					't1|0|t2|1|'
				,
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));