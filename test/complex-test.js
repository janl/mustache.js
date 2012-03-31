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

	buster.testCase('Complex', {
		'should be able to process complex templates': function(){
			var template = [
					'<h1>{{header}}</h1>',
					'{{#list}}',
					'<ul>',
					'{{#item}}',
					'{{#current}}',
					'<li><strong>{{name}}</strong></li>',
					'{{/current}}',
					'{{#link}}',
					'<li><a href="{{url}}">{{name}}</a></li>',
					'{{/link}}',
					'{{/item}}',
					'</ul>',
					'{{/list}}',
					'{{#empty}}',
					'<p>The list is empty.</p>',
					'{{/empty}}'
				].join(''),
				view = {
					header: function() {
						return "Colors";
					},
					item: [
						{name: "red", current: true, url: "#Red"},
						{name: "green", current: false, url: "#Green"},
						{name: "blue", current: false, url: "#Blue"}
					],
					link: function() {
						return this.current !== true;
					},
					list: function() {
						return this.item.length !== 0;
					},
					empty: function() {
						return this.item.length === 0;
					}
				},
				expectedResult = [
					'<h1>Colors</h1>',
					'<ul>',
					'<li><strong>red</strong></li>',
					'<li><a href="#Green">green</a></li>',
					'<li><a href="#Blue">blue</a></li>',
					'</ul>'
				].join(''),
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}(this));