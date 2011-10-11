# mustache.js — Logic-less templates with JavaScript

> What could be more logical awesome than no logic at all?

For a list of implementations (other than JavaScript) and editor
plugins, see <http://mustache.github.com/>.


## Where to Use?

You can use mustache.js rendering stuff in various scenarios. E.g. you can
render templates in your browser, or rendering server-side stuff with
[node.js][node.js], use it for rendering stuff in [CouchDB][couchdb]’s views.


## Who Uses Mustache?

An updated list is kept on the Github wiki. Add yourself, if you use
mustache.js: <http://wiki.github.com/janl/mustache.js/beard-competition>


## Usage

A quick example how to use mustache.js:

    var view = {
      title: "Joe",
      calc: function() {
        return 2 + 4;
      }
    }

    var template = "{{title}} spends {{calc}}";

    var html = Mustache.to_html(template, view);

`template` is a simple string with mustache tags and `view` is a JavaScript
object containing the data and any code to render the template.


## Template Tag Types

There are several types of tags currently implemented in mustache.js.

For a language-agnostic overview of Mustache’s template syntax, see the
`mustache(5)` manpage or <http://mustache.github.com/mustache.5.html>.

### Simple Tags

Tags are always surrounded by mustaches like this `{{foobar}}`.

    var view = {name: "Joe", say_hello: function(){ return "hello" }}

    template = "{{say_hello}}, {{name}}"


### Conditional Sections

Conditional sections begin with `{{#condition}}` and end with
`{{/condition}}`. When `condition` evaluates to true, the section is rendered,
otherwise the whole block will output nothing at all. `condition` may be a
function returning true/false or a simple boolean.

    var view = {condition: function() {
      // [...your code goes here...]
      return true;
    }}

    {{#condition}}
      I will be visible if condition is true
    {{/condition}}


### Enumerable Sections

Enumerable Sections use the same syntax as condition sections do.
`{{#shopping_items}}` and `{{/shopping_items}}`. Actually the view decides how
mustache.js renders the section. If the view returns an array, it will
iterator over the items. Use `{{.}}` to access the current item inside the
enumeration section.

    var view = {name: "Joe's shopping card",
                items: ["bananas", "apples"]}

    var template = "{{name}}: <ul> {{#items}}<li>{{.}}</li>{{/items}} </ul>"

    Outputs:
    Joe's shopping card: <ul><li>bananas</li><li>apples</li></ul>


### Higher Order Sections

If a section key returns a function, it will be called and passed both the
unrendered block of text and a renderer convenience function.

Given this JS:

    "name": "Tater",
    "bolder": function() {
      return function(text, render) {
        return "<b>" + render(text) + '</b>'
      }
    }

And this template:

    {{#bolder}}Hi {{name}}.{{/bolder}}

We'll get this output:

    <b>Hi Tater.</b>

As you can see, we’re pre-processing the text in the block. This can be used
to implement caching, filters (like syntax highlighting), etc.

You can use `this.name` to access the attribute `name` from your view.

### Dereferencing Section

If you have a nested object structure in your view, it can sometimes be easier
to use sections like this:

    var objects = {
      a_object: {
        title: 'this is an object',
        description: 'one of its attributes is a list',
        a_list: [{label: 'listitem1'}, {label: 'listitem2'}]
      }
    };

This is our template:

    {{#a_object}}
      <h1>{{title}}</h1>
      <p>{{description}}</p>
      <ul>
        {{#a_list}}
          <li>{{label}}</li>
        {{/a_list}}
      </ul>
    {{/a_object}}

Here is the result:

    <h1>this is an object</h1>
      <p>one of its attributes is a list</p>
      <ul>
        <li>listitem1</li>
        <li>listitem2</li>
      </ul>

### Inverted Sections

An inverted section opens with `{{^section}}` instead of `{{#section}}` and
uses a boolean negative to evaluate. Empty arrays are considered falsy.

View:

    var inverted_section =  {
      "repo": []
    }

Template:

    {{#repo}}<b>{{name}}</b>{{/repo}}
    {{^repo}}No repos :({{/repo}}

Result:

    No repos :(


### View Partials

mustache.js supports a quite powerful but yet simple view partial mechanism.
Use the following syntax for partials: `{{>partial_name}}`

    var view = {
      name: "Joe",
      winnings: {
        value: 1000,
        taxed_value: function() {
            return this.value - (this.value * 0.4);
        }
      }
    };

    var template = "Welcome, {{name}}! {{>winnings}}"
    var partials = {
      winnings: "You just won ${{value}} (which is ${{taxed_value}} after tax)"};

    var output = Mustache.to_html(template, view, partials)

    output will be:
    Welcome, Joe! You just won $1000 (which is $600 after tax)

You invoke a partial with `{{>winnings}}`. Invoking the partial `winnings`
will tell mustache.js to look for a object in the context's property
`winnings`. It will then use that object as the context for the template found
in `partials` for `winnings`.


## Escaping

mustache.js does escape all values when using the standard double mustache
syntax. Characters which will be escaped: `& \ " < >`. To disable escaping,
simply use triple mustaches like `{{{unescaped_variable}}}`.

Example: Using `{{variable}}` inside a template for `5 > 2` will result in `5 &gt; 2`, where as the usage of `{{{variable}}}` will result in `5 > 2`.


## Streaming

To stream template results out of mustache.js, you can pass an optional
`send()` callback to the `to_html()` call:

    Mustache.to_html(template, view, partials, function(line) {
      print(line);
    });


## Pragmas

Pragma tags let you alter the behaviour of mustache.js. They have the format
of

    {{%PRAGMANAME}}

and they accept options:

    {{%PRAGMANAME option=value}}


### IMPLICIT-ITERATOR

When using a block to iterate over an enumerable (Array), mustache.js expects
an objects as enumerable items. The implicit iterator pragma enables optional
behaviour of allowing literals as enumerable items. Consider this view:

    var view = {
      foo: [1, 2, 3, 4, 5, "french"]
    };

The following template can iterate over the member `foo`:

    {{%IMPLICIT-ITERATOR}}
    {{#foo}}
      {{.}}
    {{/foo}}

If you don't like the dot in there, the pragma accepts an option to set your
own iteration marker:

    {{%IMPLICIT-ITERATOR iterator=bob}}
    {{#foo}}
      {{bob}}
    {{/foo}}

## Template Compiler

This implementation of Mustache compiles all templates into JavaScript before
execution. This speeds up the conversion of templates into markup when the
template contains lots of sections or deeply nested constructs. Furthermore,
if you are running the same template multiple times, you can retrieve a handle
to the compiled Javascript function using the following code block:

	var template = Mustache.compile('<b>{{>foo}}{{#bar}} had a bar.{{/bar}}</b>', { foo: 'Snow White' });
	var html = template({bar:true});
	
## Command Line

See `mustache(1)` man page or
<http://defunkt.github.com/mustache/mustache.1.html>
for command line docs.

Or just install it as a RubyGem:

    $ gem install mustache
    $ mustache -h

[m]: http://github.com/defunkt/mustache/#readme
[node.js]: http://nodejs.org
[couchdb]: http://couchdb.apache.org


## Plugins for jQuery, Dojo, Yui, CommonJS

This repository lets you build modules for [jQuery][], [Dojo][], [Yui][] and
[CommonJS][] / [Node.js][] with the help of `rake`:

Run `rake jquery` to get a jQuery compatible plugin file in the
`mustache-jquery/` directory.

Run `rake dojo` to get a Dojo compatible plugin file in the `mustache-dojo/`
directory.

Run `rake yui` to get a Yui compatible plugin file in the `mustache-yui/`
directory.

Run `rake commonjs` to get a CommonJS compatible plugin file in the
`mustache-commonjs/` directory which you can also use with [Node.js][].

[jQuery]: http://jquery.com/
[Dojo]: http://www.dojotoolkit.org/
[Yui]: http://developer.yahoo.com/yui/
[CommonJS]: http://www.commonjs.org/
[Node.js]: http://nodejs.org/
