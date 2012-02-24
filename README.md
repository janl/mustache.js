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
      calc: function () {
        return 2 + 4;
      }
    };

    var output = Mustache.render("{{title}} spends {{calc}}", view);

In this example, the `Mustache.render` function takes two parameters: 1) the
[mustache](http://mustache.github.com/) template and 2) a `view` object that
contains the data and code needed to render the template.

### CommonJS

mustache.js is usable without any modification in both browsers and [CommonJS](http://www.commonjs.org/)
environments like [node.js](http://nodejs.org/). To use it as a CommonJS module,
simply require the file, like this:

    var Mustache = require("mustache");

## Templates

A [mustache](http://mustache.github.com/) template is a string that contains
any number of mustache tags. Tags are indicated by the double mustaches that
surround them. `{{person}}` is a tag, as is `{{#person}}`. In both examples we
refer to `person` as the tag's key.

There are several types of tags available in mustache.js.

### Variables

The most basic tag type is a simple variable. A `{{name}}` tag renders the value
of the `name` key in the current context. If there is no such key, nothing is
rendered.

All variables are HTML-escaped by default. If you want to render unescaped HTML,
use the triple mustache: `{{{name}}}`. You can also use `&` to unescape a
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

A section begins with a pound and ends with a slash. That is, `{{#person}}`
begins a `person` section, while `{{/person}}` ends it. The text between the two
tags is referred to as that section's "block".

The behavior of the section is determined by the value of the key.

#### False Values or Empty Lists

If the `person` key exists and has a value of `null`, `undefined`, or `false`,
or is an empty list, the block will not be rendered.

Template:

    Shown.
    {{#nothin}}
    Never shown!
    {{/nothin}}

View:

    {
      "person": true
    }

Output:

    Shown.

#### Non-Empty Lists

If the `person` key exists and is not `null`, `undefined`, or `false`, and is
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
        { "name": "Curly" }
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

If the value of a section variable is a function, it will be called in the
context of the current item in the list on each iteration.

Template:

    {{#beatles}}
    * {{name}}
    {{/beatles}}

View:

    {
      "beatles": [
        { "firstName": "John", "lastName": "Lennon" },
        { "firstName": "Paul", "lastName": "McCartney" },
        { "firstName": "George", "lastName": "Harrison" },
        { "firstName": "Ringo", "lastName": "Starr" }
      ],
      "name": function () {
        return this.firstName + " " + this.lastName;
      }
    }

Output:

    * John Lennon
    * Paul McCartney
    * George Harrison
    * Ringo Starr

#### Functions

If the value of a section key is a function, it is called with the section's
literal block of text, un-rendered, as its first argument. The second argument
is a special rendering function that uses the current view as its view argument.
It is called in the context of the current view object.

Template:

    {{#bold}}Hi {{name}}.{{/bold}}

View:

    {
      "name": "Tater",
      "bold": function () {
        return function (text, render) {
          return "<b>" + render(text) + "</b>";
        }
      }
    }

Output:

    <b>Hi Tater.</b>

### Inverted Sections

An inverted section opens with `{{^section}}` instead of `{{#section}}`. The
block of an inverted section is rendered only if the value of that section's tag
is `null`, `undefined`, `false`, or an empty list.

Template:

    {{#repos}}<b>{{name}}</b>{{/repos}}
    {{^repos}}No repos :({{/repos}}

View:

    {
      "repos": []
    }

Output:

    No repos :(

### Comments

Comments begin with a bang and are ignored. The following template:

    <h1>Today{{! ignore me }}.</h1>

Will render as follows:

    <h1>Today.</h1>

Comments may contain newlines.

### Partials

Partials begin with a greater than sign, like {{> box}}.

Partials are rendered at runtime (as opposed to compile time), so recursive
partials are possible. Just avoid infinite loops.

They also inherit the calling context. Whereas in ERB you may have this:

    <%= partial :next_more, :start => start, :size => size %>

Mustache requires only this:

    {{> next_more}}

Why? Because the `next_more.mustache` file will inherit the `size` and `start`
variables from the calling context. In this way you may want to think of
partials as includes, or template expansion, even though it's not literally true.

For example, this template and partial:

    base.mustache:
    <h2>Names</h2>
    {{#names}}
      {{> user}}
    {{/names}}

    user.mustache:
    <strong>{{name}}</strong>

Can be thought of as a single, expanded template:

    <h2>Names</h2>
    {{#names}}
      <strong>{{name}}</strong>
    {{/names}}

In mustache.js an object of partials may be passed as the third argument to
`Mustache.render`. The object should be keyed by the name of the partial, and
its value should be the partial text.

### Set Delimiter

Set Delimiter tags start with an equals sign and change the tag delimiters from
`{{` and `}}` to custom strings.

Consider the following contrived example:

    * {{ default_tags }}
    {{=<% %>=}}
    * <% erb_style_tags %>
    <%={{ }}=%>
    * {{ default_tags_again }}

Here we have a list with three items. The first item uses the default tag style,
the second uses ERB style as defined by the Set Delimiter tag, and the third
returns to the default style after yet another Set Delimiter declaration.

According to [ctemplates](http://google-ctemplate.googlecode.com/svn/trunk/doc/howto.html),
this "is useful for languages like TeX, where double-braces may occur in the
text and are awkward to use for markup."

Custom delimiters may not contain whitespace or the equals sign.

## Streaming

To stream template results out of mustache.js, you can pass an optional callback
to the call to `Mustache.render`:

    Mustache.render(template, view, partials, function (chunk) {
      print(chunk);
    });

When the template is finished rendering, the callback will be called with `null`
after which it won't be called anymore for that rendering.

## Plugins for JavaScript Libraries

By default mustache.js may be used in a browser or any [CommonJS](http://www.commonjs.org/)
environment, including [node](http://nodejs.org/). Additionally, mustache.js may
be built specifically for several different client libraries and platforms,
including the following:

  - [jQuery](http://jquery.com/)
  - [MooTools](http://mootools.net/)
  - [Dojo](http://www.dojotoolkit.org/)
  - [YUI](http://developer.yahoo.com/yui/)
  - [RequireJS](http://requirejs.org/)
  - [qooxdoo](http://qooxdoo.org/)

These may be built using [Rake](http://rake.rubyforge.org/) and one of the
following commands:

    $ rake jquery
    $ rake mootools
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
