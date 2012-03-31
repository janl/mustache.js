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

	buster.testCase('Simple', {
	    'simple exercise of api': function(){
			var template = 
					'Hello {{name}}' + '\n' +
					'You have just won ${{value}}!' + '\n' +
					'{{#in_ca}}' +
					'Well, ${{ taxed_value }}, after taxes.' +
					'{{/in_ca}}'
				,
				view = {
					name: "Chris",
					value: 10000,
					taxed_value: function() {
						return this.value - (this.value * 0.4);
					},
					in_ca: true
				},
				expectedResult = [
					'Hello Chris',
					'You have just won $10000!',
					'Well, $6000, after taxes.'			
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));