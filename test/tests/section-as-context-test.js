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

	buster.testCase('Section as context', {
	    'should allow section as context': function(){
			var template = 
					'{{#a_object}}' + 
					'  <h1>{{title}}</h1>' + '\n' +
					'  <p>{{description}}</p>' + '\n' +
					'  <ul>' + '\n' +
					'{{#a_list}}' +
					'    <li>{{label}}</li>' + '\n' +
					'{{/a_list}}' +
					'  </ul>' +
					'{{/a_object}}'
				,
				view = {
					a_object : {
						title : 'this is an object',
						description : 'one of its attributes is a list',
						a_list : [
							{ label : 'listitem1' },
							{ label : 'listitem2' }
						]
					}
				},
				expectedResult = [
					'  <h1>this is an object</h1>',
					'  <p>one of its attributes is a list</p>',
					'  <ul>',
					'    <li>listitem1</li>',
					'    <li>listitem2</li>',
					'  </ul>'
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));