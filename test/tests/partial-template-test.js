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

	buster.testCase('Partial - template', {
		'should do something': function(){
			var template =
					'<h1>{{title}}</h1>\n' +
					'{{>partial}}'
				,
				partial = 'Again, {{again}}!',
				view = {
					title : function() {
						return 'Welcome';
					},
					again: 'Goodbye'
				},
				expectedResult = 
					'<h1>Welcome</h1>\n' +
					'Again, Goodbye!'
				,
				actualResult = Mustache.to_html( template, view, { partial : partial } );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));