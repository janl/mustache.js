# mustache.js — Logic-less {{mustache}} templates with JavaScript

> What could be more logical awesome than no logic at all?

[mustache.js](http://github.com/janl/mustache.js) is an implementation of the
[Mustache](http://mustache.github.com/) template system in JavaScript.

[Mustache](http://mustache.github.com/) is a logic-less template syntax. It can
be used for HTML, config files, source code - anything. It works by expanding
tags in a template using values provided in a hash or object.

We call it "logic-less" because there are no if statements, else clauses, or for
loops. Instead there are only tags. Some tags are replaced with a value, some
nothing, and others a series of values.

For a language-agnostic overview of Mustache's template syntax, see the
`mustache(5)` [manpage](http://mustache.github.com/mustache.5.html).

## Where to use mustache.js?

You can use mustache.js to render templates in many various scenarios where you
can use JavaScript. For example, you can render templates in a browser,
server-side using [node](http://nodejs.org/), in [CouchDB](http://couchdb.apache.org/)
views, or in almost any other environment where you can use JavaScript.

## Who uses mustache.js?

An updated list of mustache.js users is kept [on the Github wiki](http://wiki.github.com/janl/mustache.js/beard-competition).
Add yourself or your company if you use mustache.js!

## Usage

Below is quick example how to use mustache.js:

    var view = {
      title: "Joe",
      calc: function() {
        return 2 + 4;
      }
    };

    var html = Mustache.to_html("{{title}} spends {{calc}}", view);

In this example, the `Mustache.to_html` function takes two parameters: 1) the
[mustache](http://mustache.github.com/) template and 2) a `view` object that
contains the data and code needed to render the template.


## Template Tag Types

There are several types of tags currently implemented in mustache.js.

### Simple Tags

Tags are always surrounded by mustaches like this `{{foobar}}`.

    var view = {name: "Joe", say_hello: function(){ return "hello" }}

    template = "{{say_hello}}, {{name}}"

#### Accessing values in nested objects (Dot Notation)

To access data logically grouped into nested objects, specify a '.' delimited
path to the value.

    var contact = {
      name: {first: "Bill", last: "Bobitybob" },
      age: 37
    }

    template = "Hello, {{name.first}} {{name.last}}. You are {{age}} years old."

*NOTICE*: The dot notation feature was recently implemented for the 0.4
  release, which is not out as of Nov 9 2011. You can find the feature in the
  current master branch of mustachejs.

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

Given this object:

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

### Dereferencing Sections

If your data has components that are logically grouped into nested objects,
you may wish to dereference an object to access its values.

Given this object:

    {
      "name": "Bill",
      "address": {
        "street": "801 Streetly street",
        "city": "Boston",
        "state": "MA",
        "zip" "02101"
      }
    }

And this template:

    <h1>Contact: {{name}}</h1>
    {{#address}}
      <p>{{street}}</p>
      <p>{{city}}, {{state}} {{zip}}</p>
    {{/address}}

We'll get this output:

    <h1>Contact: Bill</h1>
      <p>801 Streetly street</p>
      <p>Boston, MA 02101</p>

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
syntax. Characters which will be escaped: `& \ " ' < >`. To disable escaping,
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

## Plugins for JavaScript Libraries

By default mustache.js may be used in a browser or any [CommonJS](http://www.commonjs.org/)
environment, including [node](http://nodejs.org/). Additionally, mustache.js may
be built specifically for several different client libraries and platforms,
including the following:

  - [jQuery](http://jquery.com/)
  - [Dojo](http://www.dojotoolkit.org/)
  - [YUI](http://developer.yahoo.com/yui/)
  - [RequireJS](http://requirejs.org/)
  - [qooxdoo](http://qooxdoo.org/)

These may be built using [Rake](http://rake.rubyforge.org/) and one of the
following commands:

    $ rake jquery
    $ rake dojo
    $ rake yui
    $ rake requirejs
    $ rake qooxdoo

## Thanks

Mustache.js wouldn't kick ass if it weren't for these fine souls:

  * Chris Wanstrath / defunkt
  * Alexander Lang / langalex
  * Sebastian Cohnen / tisba
  * J Chris Anderson / jchris
  * Tom Robinson / tlrobinson
  * Aaron Quint / quirkey
  * Douglas Crockford
  * Nikita Vasilyev / NV
  * Elise Wood / glytch
  * Damien Mathieu / dmathieu
  * Jakub Kuźma / qoobaa
  * Will Leinweber / will
  * dpree
  * Jason Smith / jhs
  * Aaron Gibralter / agibralter
  * Ross Boucher / boucher
  * Matt Sanford / mzsanford
  * Ben Cherry / bcherry
  * Michael Jackson / mjijackson
