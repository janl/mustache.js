var tmpl = "This is the story of guys who work on a project\n" +
  "called {{project}}. Their names were {{#people}}{{firstName}} and {{/people}}\n" +
  "they both enjoyed working on {{project}}.\n\n" +
  "{{#people}}\n" + 
  "{{>personPet}}\n" +
  "{{/people}}";
var partials = {
  personPet: "{{firstName}} {{lastName}} {{#pet}} owned a {{species}}. Its name was {{name}}.{{/pet}}{{^pet}}didn't own a pet.{{/pet}}"
};
var data = {
  project: "Handlebars",
  people: [
    { firstName: "Yehuda", lastName: "Katz" },
    { firstName: "Alan", lastName: "Johnson", pet: { species: "cat", name: "Luke" } }
  ]
}

$(function() {
	var bench = new Benchmark('to_html', function() {
		Mustache.to_html(tmpl, data, partials);
	});
	bench.run();
	$('<div>' + bench.toString() + '</div>').appendTo(document.body);
	
	var bench = new Benchmark('compiled', function() {
		this.compiled_tmpl(data);
	}, {
		onStart: function() {
			this.compiled_tmpl = Mustache.compile(tmpl, partials);
		}
	});
	bench.run();
	$('<div>' + bench.toString() + '</div>').appendTo(document.body);
});