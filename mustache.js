/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = function () {
  var _toString = Object.prototype.toString;

  Array.isArray = Array.isArray || function (obj) {
    return _toString.call(obj) == "[object Array]";
  }

  var _trim = String.prototype.trim, trim;

  if (_trim) {
    trim = function (text) {
      return text == null ? "" : _trim.call(text);
    }
  } else {
    var trimLeft, trimRight;

    // IE doesn't match non-breaking spaces with \s.
    if ((/\S/).test("\xA0")) {
      trimLeft = /^[\s\xA0]+/;
      trimRight = /[\s\xA0]+$/;
    } else {
      trimLeft = /^\s+/;
      trimRight = /\s+$/;
    }

    trim = function (text) {
      return text == null ? "" :
        text.toString().replace(trimLeft, "").replace(trimRight, "");
    }
  }

  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHTML(string) {
    return String(string).replace(/&(?!\w+;)|[<>"']/g, function (s) {
      return escapeMap[s] || s;
    });
  }

  var regexCache = {};
  var Renderer = function () {};

  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    pragmas: {},
    buffer: [],
    pragmas_implemented: {
      "IMPLICIT-ITERATOR": true
    },
    context: {},

    render: function (template, context, partials, in_recursion) {
      // reset buffer & set context
      if (!in_recursion) {
        this.context = context;
        this.buffer = []; // TODO: make this non-lazy
      }

      // fail fast
      if (!this.includes("", template)) {
        if (in_recursion) {
          return template;
        } else {
          this.send(template);
          return;
        }
      }

      // get the pragmas together
      template = this.render_pragmas(template);

      // render the template
      var html = this.render_section(template, context, partials);

      // render_section did not find any sections, we still need to render the tags
      if (html === false) {
        html = this.render_tags(template, context, partials, in_recursion);
      }

      if (in_recursion) {
        return html;
      } else {
        this.sendLines(html);
      }
    },

    /*
      Sends parsed lines
    */
    send: function (line) {
      if (line !== "") {
        this.buffer.push(line);
      }
    },

    sendLines: function (text) {
      if (text) {
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; i++) {
          this.send(lines[i]);
        }
      }
    },

    /*
      Looks for %PRAGMAS
    */
    render_pragmas: function (template) {
      // no pragmas
      if (!this.includes("%", template)) {
        return template;
      }

      var that = this;
      var regex = this.getCachedRegex("render_pragmas", function (otag, ctag) {
        return new RegExp(otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" + ctag, "g");
      });

      return template.replace(regex, function (match, pragma, options) {
        if (!that.pragmas_implemented[pragma]) {
          throw({message:
            "This implementation of mustache doesn't understand the '" +
            pragma + "' pragma"});
        }
        that.pragmas[pragma] = {};
        if (options) {
          var opts = options.split("=");
          that.pragmas[pragma][opts[0]] = opts[1];
        }
        return "";
        // ignore unknown pragmas silently
      });
    },

    /*
      Tries to find a partial in the curent scope and render it
    */
    render_partial: function (name, context, partials) {
      name = trim(name);
      if (!partials || partials[name] === undefined) {
        throw({message: "unknown_partial '" + name + "'"});
      }
      if (!context || typeof context[name] != "object") {
        return this.render(partials[name], context, partials, true);
      }
      return this.render(partials[name], context[name], partials, true);
    },

    /*
      Renders inverted (^) and normal (#) sections
    */
    render_section: function (template, context, partials) {
      if (!this.includes("#", template) && !this.includes("^", template)) {
        // did not render anything, there were no sections
        return false;
      }

      var that = this;

      var regex = this.getCachedRegex("render_section", function (otag, ctag) {
        // This regex matches _the first_ section ({{#foo}}{{/foo}}), and captures the remainder
        return new RegExp(
          "^([\\s\\S]*?)" +         // all the crap at the beginning that is not {{*}} ($1)

          otag +                    // {{
          "(\\^|\\#)\\s*(.+)\\s*" + //  #foo (# == $2, foo == $3)
          ctag +                    // }}

          "\n*([\\s\\S]*?)" +       // between the tag ($2). leading newlines are dropped

          otag +                    // {{
          "\\/\\s*\\3\\s*" +        //  /foo (backreference to the opening tag).
          ctag +                    // }}

          "\\s*([\\s\\S]*)$",       // everything else in the string ($4). leading whitespace is dropped.

        "g");
      });


      // for each {{#foo}}{{/foo}} section do...
      return template.replace(regex, function (match, before, type, name, content, after) {
        // before contains only tags, no sections
        var renderedBefore = before ? that.render_tags(before, context, partials, true) : "",

        // after may contain both sections and tags, so use full rendering function
            renderedAfter = after ? that.render(after, context, partials, true) : "",

        // will be computed below
            renderedContent,

            value = that.find(name, context);

        if (type === "^") { // inverted section
          if (!value || Array.isArray(value) && value.length === 0) {
            // false or empty list, render it
            renderedContent = that.render(content, context, partials, true);
          } else {
            renderedContent = "";
          }
        } else if (type === "#") { // normal section
          if (Array.isArray(value)) { // Enumerable, Let's loop!
            renderedContent = that.map(value, function (row) {
              return that.render(content, that.create_context(row), partials, true);
            }).join("");
          } else if (that.is_object(value)) { // Object, Use it as subcontext!
            renderedContent = that.render(content, that.create_context(value),
              partials, true);
          } else if (typeof value == "function") {
            // higher order section
            renderedContent = value.call(context, content, function (text) {
              return that.render(text, context, partials, true);
            });
          } else if (value) { // boolean section
            renderedContent = that.render(content, context, partials, true);
          } else {
            renderedContent = "";
          }
        }

        return renderedBefore + renderedContent + renderedAfter;
      });
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function (template, context, partials, in_recursion) {
      // tit for tat
      var that = this;

      var new_regex = function () {
        return that.getCachedRegex("render_tags", function (otag, ctag) {
          return new RegExp(otag + "(=|!|>|&|\\{|%)?([^#\\^]+?)\\1?" + ctag + "+", "g");
        });
      };

      var regex = new_regex();
      var tag_replace_callback = function (match, operator, name) {
        switch(operator) {
        case "!": // ignore comments
          return "";
        case "=": // set new delimiters, rebuild the replace regexp
          that.set_delimiters(name);
          regex = new_regex();
          return "";
        case ">": // render partial
          return that.render_partial(name, context, partials);
        case "{": // the triple mustache is unescaped
        case "&": // & operator is an alternative unescape method
          return that.find(name, context);
        default: // escape the value
          return escapeHTML(that.find(name, context));
        }
      };
      var lines = template.split("\n");
      for(var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex, tag_replace_callback, this);
        if (!in_recursion) {
          this.send(lines[i]);
        }
      }

      if (in_recursion) {
        return lines.join("\n");
      }
    },

    set_delimiters: function (delimiters) {
      var dels = delimiters.split(" ");
      this.otag = this.escape_regex(dels[0]);
      this.ctag = this.escape_regex(dels[1]);
    },

    escape_regex: function (text) {
      // thank you Simon Willison
      if (!arguments.callee.sRE) {
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
    find: function (name, context) {
      name = trim(name);

      // Checks whether a value is thruthy or false or 0
      function is_kinda_truthy(bool) {
        return bool === false || bool === 0 || bool;
      }

      var value;

      // check for dot notation eg. foo.bar
      if (name.match(/([a-z_]+)\./ig)) {
        var childValue = this.walk_context(name, context);
        if (is_kinda_truthy(childValue)) {
          value = childValue;
        }
      } else {
        if (is_kinda_truthy(context[name])) {
          value = context[name];
        } else if (is_kinda_truthy(this.context[name])) {
          value = this.context[name];
        }
      }

      if (typeof value == "function") {
        return value.apply(context);
      }
      if (value !== undefined) {
        return value;
      }
      // silently ignore unkown variables
      return "";
    },

    walk_context: function (name, context) {
      var path = name.split('.');
      // if the var doesn't exist in current context, check the top level context
      var value_context = (context[path[0]] != undefined) ? context : this.context;
      var value = value_context[path.shift()];
      while (value != undefined && path.length > 0) {
        value_context = value;
        value = value[path.shift()];
      }
      // if the value is a function, call it, binding the correct context
      if (typeof value == "function") {
        return value.apply(value_context);
      }
      return value;
    },

    // Utility methods

    /* includes tag */
    includes: function (needle, haystack) {
      return haystack.indexOf(this.otag + needle) != -1;
    },

    // by @langalex, support for arrays of strings
    create_context: function (_context) {
      if (this.is_object(_context)) {
        return _context;
      } else {
        var iterator = ".";
        if (this.pragmas["IMPLICIT-ITERATOR"]) {
          iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
        }
        var ctx = {};
        ctx[iterator] = _context;
        return ctx;
      }
    },

    is_object: function (a) {
      return a && typeof a == "object";
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function (array, fn) {
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
    },

    getCachedRegex: function (name, generator) {
      var byOtag = regexCache[this.otag];
      if (!byOtag) {
        byOtag = regexCache[this.otag] = {};
      }

      var byCtag = byOtag[this.ctag];
      if (!byCtag) {
        byCtag = byOtag[this.ctag] = {};
      }

      var regex = byCtag[name];
      if (!regex) {
        regex = byCtag[name] = generator(this.otag, this.ctag);
      }

      return regex;
    }
  };

  return({
    name: "mustache.js",
    version: "0.4.0",

    /*
      Turns a template and view into HTML
    */
    to_html: function (template, view, partials, send_fun) {
      var renderer = new Renderer();
      if (send_fun) {
        renderer.send = send_fun;
      }
      renderer.render(template, view || {}, partials);
      if (!send_fun) {
        return renderer.buffer.join("\n");
      }
    }
  });
}();
