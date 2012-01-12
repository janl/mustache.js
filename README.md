# mustache.js - Logic-less {{mustache}} templates with JavaScript

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

    var html = Mustache.render("{{title}} spends {{calc}}", view);

In this example, the `Mustache.render` function takes two parameters: 1) the
[mustache](http://mustache.github.com/) template and 2) a `view` object that
contains the data and code needed to render the template.

## Templates

A [mustache](http://mustache.github.com/) template is a string that contains
any number of mustache tags. Tags are indicated by the double mustaches that
surround them. *{{person}}* is a tag, as is *{{#person}}*. In both examples we
refer to *person* as the tag's key.

There are several types of tags available in mustache.js.

### Variables

The most basic tag type is a simple variable. A *{{name}}* tag renders the value
of the *name* key in the current context. If there is no such key, nothing is
rendered.

All variables are HTML-escaped by default. If you want to render unescaped HTML,
use the triple mustache: *{{{name}}}*. You can also use *&* to unescape a
variable.

Template:

    * {{name}}
    * {{age}}
    * {{company}}
    * {{{company}}}
    * {{&company}}

View:

    {
      "name": "Chris",
      "company": "<b>GitHub</b>"
    }

Output:

    * Chris
    *
    * &lt;b&gt;GitHub&lt;/b&gt;
    * <b>GitHub</b>
    * <b>GitHub</b>

JavaScript's dot notation may be used to access keys that are properties of
objects in a view.

Template:

    * {{name.first}} {{name.last}}
    * {{age}}

View:

    {
      "name": {
        "first": "Michael",
        "last": "Jackson"
      },
      "age": "RIP"
    }

Output:

    * Michael Jackson
    * RIP

### Sections

Sections render blocks of text one or more times, depending on the value of the
key in the current context.

A section begins with a pound and ends with a slash. That is, *{{#person}}*
begins a *person* section, while *{{/person}}* ends it. The text between the two
tags is referred to as that section's "block".

The behavior of the section is determined by the value of the key.

#### False Values or Empty Lists

If the *person* key exists and has a value of `null`, `undefined`, or `false`,
or is an empty list, the block will not be rendered.

Template:

    Shown.
    {{#nothin}}
      Never shown!
    {{/nothin}}

View:

    {
      "person": true,
    }

Output:

    Shown.

#### Non-Empty Lists

If the *person* key exists and is not `null`, `undefined`, or `false`, and is
not an empty list the block will be rendered one or more times.

When the value is a list, the block is rendered once for each item in the list.
The context of the block is set to the current item in the list for each
iteration. In this way we can loop over collections.

Template:

    {{#stooges}}
    <b>{{name}}</b>
    {{/stooges}}

View:

    {
      "stooges": [
        { "name": "Moe" },
        { "name": "Larry" },
        { "name": "Curly" },
      ]
    }

Output:

    <b>Moe</b>
    <b>Larry</b>
    <b>Curly</b>

When looping over an array of strings, a `.` can be used to refer to the current
item in the list.

Template:

    {{#musketeers}}
    * {{.}}
    {{/musketeers}}

View:

    {
      "musketeers": ["Athos", "Aramis", "Porthos", "D'Artagnan"]
    }

Output:

    * Athos
    * Aramis
    * Porthos
    * D'Artagnan


#### Functions

If the value of a key is a function, it is called with the section's literal
block of text, unrendered, as its first argument. The second argument is a
special rendering function that uses the current view as its view argument. It
is called in the context of the current view object.


Template:

    {{#users}}
    {{#employee}}
    * {{email}}
    {{/employee}}
    {{/users}}

View:

    {
      "domain": "example.com",
      "users": [
        { "handle": "joe", "employee": true },
        { "handle": "bob", "employee": false },
        { "handle": "jim", "employee": true }
      ],
      "employee": function () {
        this.
      },
      "email": function () {
        return function (text, render) {
          return this.handle + "@" + this.domain;
        }
      }
    }

Output:

    * joe@example.com
    * bob@example.com
    * jim@example.com
    * Porthos
    * D'Artagnan


TODO - pick up here









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
