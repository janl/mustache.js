/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = function() {
  var Renderer = function() {};

  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    escaped_otag: "\{\{",
    escaped_ctag: "\}\}",
    pragmas: {},
    pragmas_implemented: {
      "IMPLICIT-ITERATOR": true
    },
    context: {},

    render: function(template, context, partials) {
      // reset context
      this.context = context;

      // fail fast
      if(!this.includes("", template)) {
        return template;
      }

      template = this.render_pragmas(template);
      
      return this.render_recursive(template, context, partials);
    },
    
    render_recursive: function(template, context, partials) {
      return this.render_delimiter(template, context, partials);
    },

    /*
      Looks for %PRAGMAS
    */
    render_pragmas: function(template) {
      // no pragmas
      if(!this.includes("%", template)) {
        return template;
      }

      var that = this;
      var regex = new RegExp(this.escaped_otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" +
            this.escaped_ctag);
      return template.replace(regex, function(match, pragma, options) {
        if(!that.pragmas_implemented[pragma]) {
          throw({message: 
            "This implementation of mustache doesn't understand the '" +
            pragma + "' pragma"});
        }
        that.pragmas[pragma] = {};
        if(options) {
          var opts = options.split("=");
          that.pragmas[pragma][opts[0]] = opts[1];
        }
        return "";
        // ignore unknown pragmas silently
      });
    },

    render_delimiter: function(template, context, partials) {
      if(!this.includes("=", template)) {
        return this.render_section(template, context, partials);
      }
      
      var regex = new RegExp("(" + this.escaped_otag + "=(?:\\S+)\\s+(?:\\S+)=" + this.escaped_ctag + "\\n*)", "mg");
      var fragments = template.split(regex);
      
      var i, n;
      var r = new RegExp(this.escaped_otag + "=(\\S+)\\s+(\\S+)=" + this.escaped_ctag);
      var matches;
      
      for (i=0, n=fragments.length; i<n; ++i) {
        matches = fragments[i].match(r);
        if(matches && matches.length===3) {
          var old_otag = this.otag;
          var old_ctag = this.ctag;
          
          this.set_delimiters(matches[1], matches[2]);
          
          fragments[i] = this.render_delimiter(fragments.slice(i+1).join(""), context, partials);
          
          this.set_delimiters(old_otag, old_ctag);
          
          fragments = fragments.slice(0,i+1);
          
          break;
        } else {
          fragments[i]=this.render_section(fragments[i], context, partials);
        }
      }
      
      return fragments.join("");
    },
    
    /*
      Tries to find a partial in the current scope and render it
    */
    render_partial: function(name, context, partials) {
      name = this.trim(name);
      if(!partials || partials[name] === undefined) {
        throw({message: "unknown_partial '" + name + "'"});
      }
      if(typeof(context[name]) != "object") {
        return this.render_recursive(partials[name], context, partials);
      }
      return this.render_recursive(partials[name], context[name], partials);
    },

    /*
      Renders inverted (^) and normal (#) sections
    */
    render_section: function(template, context, partials) {
      if(!this.includes("#", template) && !this.includes("^", template)) {
        return this.render_tags(template, context, partials);
      }

      var regex = new RegExp(
        "(" + this.escaped_otag + "(?:\\^|\\#)\\s*(.+?)(?:\\(.*\\))?\\s*" + this.escaped_ctag + 
        "\n*[\\s\\S]+?" + this.escaped_otag + "\\/\\s*\\2\\s*" + this.escaped_ctag + "\\s*)",
        "mg");

      var i, n;
      var lastWasSection = false;
      var fragments = template.split(regex);
      
      for (i=0, n=fragments.length; i<n; ++i) {
        if(lastWasSection) {
          fragments[i] = "";
          lastWasSection = false;
          continue;
        }
        
        if(fragments[i].indexOf(this.otag+"#")===0 || fragments[i].indexOf(this.otag+"^")===0) {
          lastWasSection = true;
          fragments[i] = this.render_section_internal(fragments[i], context, partials);
        } else {
          fragments[i] = this.render_tags(fragments[i], context, partials);
        }
      }
      
      return fragments.join("");
    },
    
    render_section_internal: function(template, context, partials) {
      var that = this;
      // CSW - Added "+?" so it finds the tighest bound, not the widest
      var regex = new RegExp(this.escaped_otag + "(\\^|\\#)\\s*((.+?)(\\(.*\\))?)\\s*" + this.escaped_ctag +
              "\n*([\\s\\S]+?)" + this.escaped_otag + "\\/\\s*\\3\\s*" + this.escaped_ctag +
              "\\s*", "mg");

      // for each {{#foo}}{{/foo}} section do...
      var fragment = template.replace(regex, function(match, type, name, reserved1, reserved2, content) {
        // the reserved variables are not being used
        var value = that.find(name, context);
        if(type == "^") { // inverted section
          if(!value || that.is_array(value) && value.length === 0) {
            // false or empty list, render it
            return that.render_recursive(content, context, partials);
          } else {
            return "";
          }
        } else if(type == "#") { // normal section
          if(that.is_array(value)) { // Enumerable, Let's loop!
            return that.map(value, function(row) {
              return that.render_recursive(content, that.create_context(row),
                partials, true);
            }).join("");
          } else if(that.is_object(value)) { // Object, Use it as subcontext!
            return that.render_recursive(content, that.create_context(value),
              partials, true);
          } else if(typeof value === "function") {
            // higher order section
            return value.call(context, content, function(text) {
              return that.render_recursive(text, context, partials);
            });
          } else if(value) { // boolean section
            return that.render_recursive(content, context, partials);
          } else {
            return "";
          }
        }
      });
      
      return fragment;
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function(template, context, partials) {
      // tit for tat
      var that = this;

      var new_regex = function() {
        return new RegExp(that.escaped_otag + "(!|>|\\{|&|%)?([^\\/#\\^=]+?)\\1?" +
          that.escaped_ctag + "+", "g");
      };

      var regex = new_regex();
      var tag_replace_callback = function(match, operator, name) {
        switch(operator) {
        case "!": // ignore comments
          return "";
        case ">": // render partial
          return that.render_partial(name, context, partials);
        case "{": // the triple mustache is unescaped
        case "&": // the ampersand is also unescaped
          return that.find(name, context);
        default: // escape the value
          return that.escape(that.find(name, context));
        }
      };
      var lines = template.split("\n");
      var oldContent;
      for(var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex, tag_replace_callback, this);
      }

      return lines.join("\n");
    },

    set_delimiters: function(open, close) {
      this.otag = open;
      this.ctag = close;
      
      this.escaped_otag = this.escape_regex(open);
      this.escaped_ctag = this.escape_regex(close);
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

      // Checks whether a value is truthy or false or 0
      function is_kinda_truthy(bool) {
        return bool === false || bool === 0 || bool;
      }

      var value;
      if(is_kinda_truthy(context[name])) {
        value = context[name];
      } else if(is_kinda_truthy(this.context[name])) {
        value = this.context[name];
      }
      if(typeof value === "function") {
        return value.apply(context);
      }
      if(value !== undefined) {
        return value;
      }
      if (value === undefined && name.indexOf('(') != -1) {
        // if value turned out to not exist on the context, then check to see if the function is parameterized
        var matches = name.match(/(.+)\((.+,?)+\)/);

        if (matches.length === 3) {
          name = matches[1];
          value = this.context[name];

          if (typeof value === "function" && matches[2]) {
            var that = this;
            var args = this.map(matches[2].split(/\s*,/), 
              function(ele) { return that.find(ele, that.context); });
            return value.apply(context, args);
          }
        }
      }	  
      // silently ignore unknown variables
      return "";
    },

    // Utility methods

    /* includes tag */
    includes: function(needle, haystack) {
      return haystack.indexOf(this.otag + needle) != -1;
    },

    /*
      Does away with nasty characters
    */
    escape: function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|["<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";
        case '"': return '\"';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
    },

    // by @langalex, support for arrays of strings
    create_context: function(_context) {
      if(this.is_object(_context)) {
        return _context;
      } else {
        var iterator = ".";
        if(this.pragmas["IMPLICIT-ITERATOR"]) {
          iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
        }
        var ctx = {};
        ctx[iterator] = _context;
        return ctx;
      }
    },

    is_object: function(a) {
      return a && typeof a == "object";
    },

    is_array: function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },

    /*
      Gets rid of leading and trailing whitespace
    */
    trim: function(s) {
      return s.replace(/^\s*|\s*$/g, "");
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function(array, fn) {
      if (typeof array.map == "function") {
        return array.map(fn);
      } else {
        var r = [];
        var l = array.length;
        for(var i = 0; i < l; i++) {
          r.push(fn(array[i]));
        }
        return r;
      }
    }
  };

  return({
    name: "mustache.js",
    version: "0.3.0-dev",

    /*
      Turns a template and view into HTML
    */
    to_html: function(template, view, partials) {
      var renderer = new Renderer();
      return renderer.render(template, view, partials);
    }
  });
}();
