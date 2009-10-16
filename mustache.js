/*
  Shamless port of http://github.com/defunkt/mustache
  by Jan Lehnardt <jan@apache.org>

  Thanks @defunkt for the awesome code.
  
  See http://github.com/defunkt/mustache for more info.
*/

var Mustache = {
  name: "mustache.js",
  version: "0.1",
  context: {},
  otag: "{{",
  ctag: "}}",

  /*
    Public method. Turns a template and view into HTML
  */
  to_html: function(template, view) {
    return this.render(template, view);
  },

  // Private Methods
  render: function(template, view) {
    // fail fast
    if(template.indexOf(this.otag) == -1) {
      return template;
    }

    // keep context around for recursive calls
    this.context = context = this.merge((this.context || {}), view);

    // first, render all sections 
    var html = this.render_section(template);

    // restore context, recursion might have messed it up
    this.context = context;

    // finally, render tags
    
    // render until all is rendered
    return this.render_tags(html);
  },

  /* 
    Tries to find a partial in the global scope and render it
  */
  render_partial: function(name) {
    // FIXME: too hacky
    var evil_name = eval(name)
    switch(typeof evil_name) {
      case "string": // a tring partial, we simply render
        return this.to_html(evil_name, "");
      case "object": // a view partial needs a `name_template` template to render
        var tpl = name + "_template";
        return this.to_html(eval(tpl), evil_name);
      default: // should not happen #famouslastwords
        throw("Unknown partial type.");
    }
  },

  /*
    Renders boolean and enumerable sections
  */
  render_section: function(template) {
    if(template.indexOf(this.otag + "#") == -1) {
      return template;
    }
    var that = this;
    var regex = new RegExp(this.otag + "\\#(.+)" + this.ctag + "\\s*([\\s\\S]+)" + this.otag + "\\/\\1" + this.ctag + "\\s*", "mg");
    // for each {{#foo}}{{/foo}} section do...
    return template.replace(regex, function(match, name, content) {
        var value = that.find(name);
        if(that.is_array(value)) { // Enumerable, Let's loop!
          return value.map(function(row) {
            return that.render(content, row);
          }).join('');
        } else if(value) { // boolean section
          return that.render(content);
        } else {
          return "";
        }
      }
    );
  },

  /*
    Replace {{foo}} and friends with values from our view
  */
  render_tags: function(template) {
    var pop_first = function(lines) {
      var lines_array = lines.split("\n");
      lines_array.shift();
      return lines_array.join("\n");
    };

    var new_regex = function() {
      return new RegExp(that.otag + "(=|!|<|\\{)?([^\/#]+?)\\1?" + that.ctag + "+", "m");
    };

    // tit for tat
    var that = this;
    // for each {{(!<{)?foo}} tag, do...
    regex = new_regex();
    var lines = template;
    while(regex.test(lines)) {
      template = template.replace(regex, function (match, operator, name) {
        switch(operator) {
          case "!": // ignore comments
            return match;
          case "=": // set new delimiters
            that.set_delimiters(name);
            return "";
          case "<": // render partial
            return that.render_partial(name);
          case "{": // the triple mustache is unescaped
            return that.find(name);
          default: // escape the value
            // print("render name: '" +name+ "'");
            return that.escape(that.find(name));
        }
      }, this);
      regex = new_regex();
      lines = pop_first(lines);
    } 
    return template;
  },
  
  set_delimiters: function(delimiters) {
    var dels = delimiters.split(" ");
    this.otag = this.escape_regex(dels[0]);
    this.ctag = this.escape_regex(dels[1]);
  },

  escape_regex: function(text) {
    // thank you Simon Willison
    if(!arguments.callee.sRE) {
      var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ];
      arguments.callee.sRE = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
      );
    }
  return text.replace(arguments.callee.sRE, '\\$1');
  },

  /*
    find `name` in current `context`. That is find me a value 
    from the view object
  */
  find: function(name) {
    name = this.trim(name);
    var context = this.context;
    if(typeof context[name] === "function") {
      return context[name].apply(context);
    }
    if(context[name] !== undefined) {
      return context[name];
    }
    throw("Can't find " + name + " in " + context);
  },

  // Utility methods

  /*
    Does away with nasty characters
  */
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

  /*
    Merges all properties of object `b` into object `a`. 
    `b.property` overwrites a.property`
  */
  merge: function(a, b) {
    for(var name in b) {
      if(b.hasOwnProperty(name)) {
        a[name] = b[name];
      }
    }
    return a;
  },

  /*
    Thanks Doug Crockford
    JavaScript — The Good Parts lists an alternative that works better with
    frames. Frames can suck it, we use the simple version.
  */
  is_array: function(a) {
    return (a &&
      typeof a === 'object' &&
      a.constructor === Array);
  },

  /*
    Gets rid of leading and trailing whitespace
  */
  trim: function(s) {
    return s.replace(/^\s*|\s*$/g, '');
  },
};
