/*
  Shamless port of http://github.com/defunkt/mustache
  by Jan Lehnardt <jan@apache.org>, Alexander Lang <alex@upstream-berlin.com>

  Thanks @defunkt for the awesome code.
  
  See http://github.com/defunkt/mustache for more info.
*/

var Mustache = function() {
  var Renderer = function() {};
  
  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    
    render: function(template, context) {
      // fail fast
      if(template.indexOf(this.otag) == -1) {
        return template;
      }

      var html = this.render_section(template, context);
      return this.render_tags(html, context);
    },

    create_context: function(_context) {
      if(this.is_object(_context)) {
        return _context;
      } else {
        return {'.': _context};
      }
    },

    is_object: function(a) {
      return a && typeof a == 'object'
    },

    /* 
      Tries to find a partial in the global scope and render it
    */
    render_partial: function(name, context) {
      // FIXME: too hacky
      var evil_name = eval(name);
      switch(typeof evil_name) {
        case "string": // a string partial, we simply render
          return this.render(evil_name, context);
        case "object": // a view partial needs a `name_template` template
          var tpl = name + "_template";
          return this.render(eval(tpl), evil_name);
        default: // should not happen #famouslastwords
          throw("Unknown partial type.");
      }
    },

    /*
      Renders boolean and enumerable sections
    */
    render_section: function(template, context) {
      if(template.indexOf(this.otag + "#") == -1) {
        return template;
      }
      var that = this;
      var regex = new RegExp(this.otag + "\\#(.+)" + this.ctag +
        "\\s*([\\s\\S]+)" + this.otag + "\\/\\1" + this.ctag + "\\s*", "mg");

      // for each {{#foo}}{{/foo}} section do...
      return template.replace(regex, function(match, name, content) {
          var value = that.find(name, context);
          if(that.is_array(value)) { // Enumerable, Let's loop!
            return value.map(function(row) {
              return that.render(content, that.merge(context, that.create_context(row)));
            }).join('');
          } else if(value) { // boolean section
            return that.render(content, context);
          } else {
            return "";
          }
        }
      );
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function(template, context) {
      var lines = template.split("\n");
     
      var new_regex = function() {
        return new RegExp(that.otag + 
                          "(=|!|<|\\{)?([^\/#]+?)\\1?" +
                          that.ctag + "+",
                          "g");
      };

      // tit for tat
      var that = this;

      var regex = new_regex();
      for (var i=0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex,
                function (match,operator,name) {
                  switch(operator) {
                    case "!": // ignore comments
                      return match;
                    case "=": // set new delimiters, rebuild the replace regexp
                      that.set_delimiters(name);
                      regex = new_regex();
                      return "";
                    case "<": // render partial
                      return that.render_partial(name, context);
                    case "{": // the triple mustache is unescaped
                      return that.find(name, context);
                    default: // escape the value
                      return that.escape(that.find(name, context));
                  }},
                  this);
      };

      return lines.join("\n");
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
    find: function(name, context) {
      name = this.trim(name);
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
      var _new = {};
      for(var name in a) {
        if(a.hasOwnProperty(name)) {
          _new[name] = a[name];
        }
      };
      for(var name in b) {
        if(b.hasOwnProperty(name)) {
          _new[name] = b[name];
        }
      };
      return _new;
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
    }
  };
  
  return({
    name: "mustache.js",
    version: "0.1",
    
    /*
      Turns a template and view into HTML
    */
    to_html: function(template, view) {
      return new Renderer().render(template, view);
    }
  });
}();
