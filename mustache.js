/*
  Shamless port of http://github.com/defunkt/mustache
    by Jan Lehnardt <jan@apache.org>

  Thanks @defunkt for the awesome code
  TBD: MIT, see LICENSE
  
  ChangeLog:
   - 04.10.2009: Ininitial port at http://devhouseberlin.de/

*/

var Mustache = {
  name: "mustache.js",
  version: "0.1",
  debug: true,
  stack: " ",
  context: {},
  to_html: function(template, view) {
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
    this.context = context;
    return this.render_tags(html);
  },

  render_partial: function(name) {
    var evil_name = eval(name)
    switch(typeof evil_name) {
      case "string":
        return this.to_html(evil_name, "");
      case "object":
        var tpl = name + "_template";
        return this.to_html(eval(tpl), evil_name);
      default:
        throw("Unknown partial type.");
    }
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
    return template.replace(/\{\{\#(.+)\}\}\s*([\s\S]+)\{\{\/\1\}\}\s*/mg,
      function(match, name, content) {
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
          case "<": // render partial
            return that.render_partial(name);
          case '{': // the triple mustache is unescaped
            return that.find(name);
          default: // escape the value
            return that.escape(that.find(name));
        }
      }, this);
  },
  
  escape: function(s) {
    return s.toString().replace(/[&"<>\\]/g, function(s) {
      switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";;
        case '"': return '\"';;
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
      }
    });
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
