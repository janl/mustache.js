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

	buster.testCase('String as context', {
	    'should allow a string to be used as context': function(){
			var template = [
					'<ul>{{#a_list}}',
					'    <li><a href="#{{a_string}}/{{.}}">{{.}}</a></li>',
					'{{/a_list}}</ul>'
				].join(''),
				view = {
				    a_string: 'aa',
				    a_list: ['a','b','c']
				},
				expectedResult = [
					'<ul>',
					'    <li><a href="#aa/a">a</a></li>',
					'    <li><a href="#aa/b">b</a></li>',
					'    <li><a href="#aa/c">c</a></li>',
					'</ul>'
				].join(''),
				actualResult = Mustache.to_html( template, view );
		
	        assert.equals( actualResult, expectedResult );
	    }
	});	
}(this));