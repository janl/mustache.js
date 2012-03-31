/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Partial - view', {
	    'should allow use of partials': function(){
			var template = 
					'<h1>{{greeting}}</h1>\n' +
					'{{>partial}}' + 
					'<h3>{{farewell}}</h3>'				
				,
				partial = 
					'Hello {{name}}\n' +
					'You have just won ${{value}}!\n' +
					'{{#in_ca}}' + 
					'Well, ${{ taxed_value }}, after taxes.\n' +
					'{{/in_ca}}'
				,
				view = {
					greeting: function() {
						return "Welcome";
					},
					farewell: function() {
						return "Fair enough, right?";
					},
					name: "Chris",
					value: 10000,
					taxed_value: function() {
						return this.value - (this.value * 0.4);
					},
					in_ca: true
				},
				expectedResult = [
					'<h1>Welcome</h1>',
					'Hello Chris',
					'You have just won $10000!',
					'Well, $6000, after taxes.',
					'<h3>Fair enough, right?</h3>'
				].join('\n'),
				actualResult = Mustache.to_html( template, view, { partial : partial } );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}());