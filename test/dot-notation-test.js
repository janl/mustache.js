/*jslint white:true, plusplus:true */
/*global
	buster,
	assert,
	Mustache
*/
(function(){
	'use strict';
	
	buster.testCase('Dot notation', {
		'should be able to use dot notation for looking up properties': function(){
			var template = [
					'<!-- exciting part -->',
					'<h1>{{name}}</h1>',
					'<p>Authors: <ul>{{#authors}}<li>{{.}}</li>{{/authors}}</ul></p>',
					'<p>Price: {{price.currency.symbol}}{{price.value}} {{#price.currency}}{{name}} <b>{{availability.text}}</b>{{/price.currency}}</p>',
					'<p>VAT: {{price.currency.symbol}}{{price.vat}}</p>',
					'<!-- boring part -->',
					'<h2>Test truthy false values:</h2>',
					'<p>Zero: {{truthy.zero}}</p>',
					'<p>False: {{truthy.notTrue}}</p>'
				].join('\n'),
				view = {
					name : "A Book",
					authors : ["John Power", "Jamie Walsh"],
					price : {
						value : 200,
						vat : function(){
							return this.value * 0.2;
						},
						currency : {
							symbol : '&euro;',
							name : 'Euro'
						}
					},
					availability:{
						status: true,
						text: "In Stock"
					},
					// And now, some truthy false values
					truthy : {
						zero : 0,
						notTrue : false
					}
				},
				expectedResult = [
					'<!-- exciting part -->',
					'<h1>A Book</h1>',
					'<p>Authors: <ul><li>John Power</li><li>Jamie Walsh</li></ul></p>',
					'<p>Price: &euro;200 Euro <b>In Stock</b></p>',
					'<p>VAT: &euro;40</p>',
					'<!-- boring part -->',
					'<h2>Test truthy false values:</h2>',
					'<p>Zero: 0</p>',
					'<p>False: false</p>'
				].join('\n'),
				actualResult = Mustache.to_html( template, view );
		
			assert.equals( actualResult, expectedResult );
		}
	}); 
}());

