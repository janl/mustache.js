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

	buster.testCase('Recursion with same names', {
	    'should not fail just because the same names appear in output as with recursion': function(){
			var template = 
					'{{ name }}' + '\n' +
					'{{ description }}' + '\n' +
					'\n' +
					'{{#terms}}' +
					'  {{name}}' + '\n' +
					'  {{index}}' + '\n' +
					'{{/terms}}'
				,
				view = {
					name : 'name',
					description : 'desc',
					terms : [
						{ name : 't1', index : 0 },
						{ name : 't2', index : 1 }
					]						
				},
				expectedResult = [
					'name',
					'desc',
					'',
					'  t1',
					'  0',
					'  t2',
					'  1'
				].join('\n') + '\n',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));