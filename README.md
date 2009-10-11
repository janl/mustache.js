# mustache.js

> What could be more logical awesome than no logic at all?

Shamless port of http://github.com/defunkt/mustache 
by Jan Lehnardt <jan@apache.org>.

Thanks @defunkt for the awesome code.


## Usage

  // load mustache.js
  
  var view = {
    title: "foo",
    calc: function() {
      return 2 + 4;
    }
  }
  
  var template = "{{title}} spends {{calc}}";
  
  var html = Mustache.to_html(template, view);
  
  // whatever you want to do with html

See `examples/` for more goodies and read the [original mustache docs][m]

[m]: http://github.com/defunkt/mustache/
