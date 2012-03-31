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
	
	buster.testCase('Keys with questionmarks', {
	    'should support keys with qustionmarks in views': function(){
			var template = '{{#person?}}Hi {{name}}!{{/person?}}',
				view = {
					"person?" : {
						name: "Jon"
					}
				},
				expectedResult = 'Hi Jon!',
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));