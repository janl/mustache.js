/*
  Shamless port of http://github.com/defunkt/mustache
    by Jan Lehnardt <jan@apache.org>

  Thanks @defunkt for the awesome code
  TBD: License
  
  ChangeLog:
   - 04.10.2009: Ininitial port at http://devhouseberlin.de/

*/

var Mustache = {
  name: "mustache.js",
  version: "0.1",
  debug: true,
  stack: " ",
  context: {},
  to_html: function(view, template) {
    return this.render(template, view);
  },

  render: function(template, view) {
    this.stack = this.stack + " ";
    // fail fast
    if(template.indexOf("{{") == -1) {
      return template;
    }
    this.context = context = this.merge((this.context || {}), view);
    var html = this.render_section(template);
    // restore context, recursion might have messed it up
    // this.context = context;
    return this.render_tags(html);
  },

  merge: function(a, b) {
    for(var name in b) {
      if(b.hasOwnProperty(name)) {
        a[name] = b[name];
      }
    }
    return a;
  },

  render_section: function(template) {
    if(template.indexOf("{{#") == -1) {
      return template;
    }
    var that = this;
    return template.replace(/\{\{\#(.+)\}\}\s*(.+)\s*\{\{\/\1\}\}\s*/mg,
      function(match, name, content) {
        print(match);
        print(name);
        print(content);
        var value = that.find(name);
        if(that.is_array(value)) {
          return value.map(function(row) {
            return that.render(content, row);
          }).join('');
        } else if(value) {
          return that.render(content);
        } else {
          return "";
        }
      }
    );
  },
  
  is_array: function(a) {
    return (a && 
      typeof a === 'object' && 
      a.constructor === Array);
  },

  render_tags: function(template) {
    // values
    var that = this;
    return template.replace(/\{\{(!|<|\{)?([^\/#]+?)\1?\}\}+/mg,
      function (match, operator, name) {
      switch(operator) {
        case "!": // ignore comments
          return match;
        // TODO: partials
        // case "<": // render partial
        //   return this.render_partial()
        case '{': // the triple mustache is unescaped
          return that.find(name);
        default: // escape the value
          return that.find(name);
      }
    }, this);
  },

  find: function(name) {
    name = this.trim(name);
    // print(this.stack + "find(" + name + ")");
    var context = this.context;
    if(typeof context[name] === "function") {
      return context[name].apply(context);
    }
    if(context[name] !== undefined) {
      return context[name];
    }
    throw("Can't find " + name + " in " + context);
  },

  trim: function(s) {
    return s.replace(/^\s*|\s*$/g, '');
  },
};
