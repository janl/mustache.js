/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
var Mustache = (typeof module !== "undefined" && module.exports) || {};

(function (exports) {

  exports.name = "mustache.js";
  exports.version = "0.5.0-dev";
  exports.tags = ["{{", "}}"];
  exports.parse = parse;
  exports.compile = compile;
  exports.render = render;
  exports.clearCache = clearCache;

  var NODE_TYPES = {
    TEMPLATE: 'tmpl'
  , PARTIAL: 'par'
  , SECTION: 'sec'
  , PLAIN: 'plain'
  , ESCAPED: 'esc'
  , TEXT: 'txt'
  };

  // This is here for backwards compatibility with 0.4.x.
  exports.to_html = function (template, view, partials, send) {
    var result = render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

  var _toString = Object.prototype.toString;
  var _isArray = Array.isArray;
  var _forEach = Array.prototype.forEach;
  var _reduce = Array.prototype.reduce;
  var _trim = String.prototype.trim;

  var isArray;
  if (_isArray) {
    isArray = _isArray;
  } else {
    isArray = function (obj) {
      return _toString.call(obj) === "[object Array]";
    };
  }

  var forEach;
  if (_forEach) {
    forEach = function (obj, callback, scope) {
      return _forEach.call(obj, callback, scope);
    };
  } else {
    forEach = function (obj, callback, scope) {
      for (var i = 0, len = obj.length; i < len; ++i) {
        callback.call(scope, obj[i], i, obj);
      }
    };
  }

  var spaceRe = /^\s*$/;

  function isWhitespace(string) {
    return spaceRe.test(string);
  }

  var trim;
  if (_trim) {
    trim = function (string) {
      return string == null ? "" : _trim.call(string);
    };
  } else {
    var trimLeft, trimRight;

    if (isWhitespace("\xA0")) {
      trimLeft = /^\s+/;
      trimRight = /\s+$/;
    } else {
      // IE doesn't match non-breaking spaces with \s, thanks jQuery.
      trimLeft = /^[\s\xA0]+/;
      trimRight = /[\s\xA0]+$/;
    }

    trim = function (string) {
      return string == null ? "" :
        String(string).replace(trimLeft, "").replace(trimRight, "");
    };
  }

  var reduce;
  if (_reduce) {
    reduce = function (array) {
      var args = Array.prototype.slice.call(arguments, 1);
      return _reduce.apply(array, args)
    };
  } else {
    reduce = function (array, callback, initialValue) {
      var i, value;
      if (arguments.length < 3) {
        value = array[0];
        i = 1;
      } else {
        value = initialValue;
        i = 0;
      }
      for (i; i < array.length; i++) {
        value = callback(value, array[i], i, array);
      }
      return value;
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

  // OSWASP Guidlines: escape all non alphanumeric characters in ASCII space.
  var JAVASCRIPT_CHARACTERS_EXPRESSION =
      /[\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\xFF\u2028\u2029]/gm;
  function encodeJavaScriptString(text) {
    return text && '"' + text.replace(JAVASCRIPT_CHARACTERS_EXPRESSION, function (c) {
      return "\\u" + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    }) + '"';
  }
  // This is not great, but it is useful.
  var JSON_STRING_LITERAL_EXPRESSION =
      /"(?:\\.|[^"])*"/gm;
  function encodeJavaScriptData(object) {
    return JSON.stringify(object).replace(JSON_STRING_LITERAL_EXPRESSION, function (string) {
      return encodeJavaScriptString(JSON.parse(string));
    });
  }

  /**
   * Adds the `template`, `line`, and `file` properties to the given error
   * object and alters the message to provide more useful debugging information.
   */
  function debug(e, template, line, file) {
    file = file || "<template>";

    var lines = template.split("\n"),
        start = Math.max(line - 3, 0),
        end = Math.min(lines.length, line + 3),
        context = lines.slice(start, end);

    var c;
    for (var i = 0, len = context.length; i < len; ++i) {
      c = i + start + 1;
      context[i] = (c === line ? " >> " : "    ") + context[i];
    }

    e.template = template;
    e.line = line;
    e.file = file;
    e.message = [file + ":" + line, context.join("\n"), "", e.message].join("\n");

    return e;
  }

  /**
   * Looks up the value of the given `name` in the given context `stack`.
   */
  function lookup(name, stack, defaultValue) {
    if (name === ".") {
      return stack[stack.length - 1];
    }

    var names = name.split(".");
    var lastIndex = names.length - 1;
    var target = names[lastIndex];

    var value, context, i = stack.length, j, localStack;
    while (i) {
      localStack = stack.slice(0);
      context = stack[--i];

      j = 0;
      while (j < lastIndex) {
        context = context[names[j++]];

        if (context == null) {
          break;
        }

        localStack.push(context);
      }

      if (context && typeof context === "object" && target in context) {
        value = context[target];
        break;
      }
    }

    // If the value is a function, call it in the current context.
    if (typeof value === "function") {
      value = value.call(localStack[localStack.length - 1]);
    }

    if (value == null)  {
      return defaultValue;
    }

    return value;
  }

  function renderSection(name, stack, callback, inverted) {
    var buffer = "";
    var value =  lookup(name, stack);

    if (inverted) {
      // From the spec: inverted sections may render text once based on the
      // inverse value of the key. That is, they will be rendered if the key
      // doesn't exist, is false, or is an empty list.
      if (value == null || value === false || (isArray(value) && value.length === 0)) {
        buffer += callback();
      }
    } else if (isArray(value)) {
      forEach(value, function (value) {
        stack.push(value);
        buffer += callback();
        stack.pop();
      });
    } else if (typeof value === "object") {
      stack.push(value);
      buffer += callback();
      stack.pop();
    } else if (typeof value === "function") {
      var scope = stack[stack.length - 1];
      var scopedRender = function (template) {
        return render(template, scope);
      };
      buffer += value.call(scope, callback(), scopedRender) || "";
    } else if (value) {
      buffer += callback();
    }

    return buffer;
  }

  /**
   * Parses the given `template` and returns the abstract syntax tree for it.
   * Recognized options include the following:
   *
   *   - file     The name of the file the template comes from (displayed in
   *              error messages)
   *   - tags     An array of open and close tags the `template` uses. Defaults
   *              to the value of Mustache.tags
   *   - space    Set `true` to preserve whitespace from lines that otherwise
   *              contain only a {{tag}}. Defaults to `false`
   */
  function parse(template, options) {
    options = options || {};

    var tags = options.tags || exports.tags,
        openTag = tags[0],
        closeTag = tags[tags.length - 1];

    var spaces = [],      // indices of whitespace in code on the current line
        hasTag = false,   // is there a {{tag}} on the current line?
        nonSpace = false; // is there a non-space char on the current line?

    var nodes = [];
    var node = {
      type: NODE_TYPES.TEMPLATE
    , line: 0
    , file: options.file
    , children: []
    };

    // Strips all space characters from the nodes if there was a {{tag}} on it
    // and otherwise only spaces.
    var stripSpace = function () {
      if (hasTag && !nonSpace && !options.space) {
        while (spaces.length) {
          var space = spaces.pop();
          space[0].children.splice(space[1], 1);
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    };

    var sectionStack = [], nextOpenTag, nextCloseTag;

    var setTags = function (source) {
      tags = trim(source).split(/\s+/);
      nextOpenTag = tags[0];
      nextCloseTag = tags[tags.length - 1];
    };

    var includePartial = function (source) {
      var n = {
        type: NODE_TYPES.PARTIAL
      , line: line
      , key: trim(source)
      };
      node.children.push(n);
    };

    var openSection = function (source, inverted) {
      var name = trim(source);

      if (name === "") {
        throw debug(new Error("Section name may not be empty"), template, line, options.file);
      }

      sectionStack.push({name: name, inverted: inverted});

      var n = {
        type: NODE_TYPES.SECTION
      , line: line
      , key: name
      , inverted: !!inverted
      , children: []
      }
      node.children.push(n);

      nodes.push(node); // save context
      node = n;
    };

    var openInvertedSection = function (source) {
      openSection(source, true);
    };

    var closeSection = function (source) {
      var name = trim(source);
      var openName = sectionStack.length != 0 && sectionStack[sectionStack.length - 1].name;

      if (!openName || name != openName) {
        throw debug(new Error('Section named "' + name + '" was never opened'), template, line, options.file);
      }

      var section = sectionStack.pop();

      var n = nodes.pop(); // restore context
      node = n;
    };

    var sendPlain = function (source) {
      var n = {
        type: NODE_TYPES.PLAIN
      , line: line
      , key: trim(source)
      };

      node.children.push(n);
    };

    var sendEscaped = function (source) {
      var n = {
        type: NODE_TYPES.ESCAPED
      , line: line
      , key: trim(source)
      };

      node.children.push(n);
    };

    var line = 1, c, callback;
    for (var i = 0, len = template.length; i < len; ++i) {
      if (template.slice(i, i + openTag.length) === openTag) {
        i += openTag.length;
        c = template.substr(i, 1);
        nextOpenTag = openTag;
        nextCloseTag = closeTag;
        hasTag = true;

        switch (c) {
        case "!": // comment
          i++;
          callback = null;
          break;
        case "=": // change open/close tags, e.g. {{=<% %>=}}
          i++;
          closeTag = "=" + closeTag;
          callback = setTags;
          break;
        case ">": // include partial
          i++;
          callback = includePartial;
          break;
        case "#": // start section
          i++;
          callback = openSection;
          break;
        case "^": // start inverted section
          i++;
          callback = openInvertedSection;
          break;
        case "/": // end section
          i++;
          callback = closeSection;
          break;
        case "{": // plain variable
          closeTag = "}" + closeTag;
          // fall through
        case "&": // plain variable
          i++;
          nonSpace = true;
          callback = sendPlain;
          break;
        default: // escaped variable
          nonSpace = true;
          callback = sendEscaped;
        }

        var end = template.indexOf(closeTag, i);

        if (end === -1) {
          throw debug(new Error('Tag "' + openTag + '" was not closed properly'), template, line, options.file);
        }

        var source = template.substring(i, end);

        if (callback) {
          callback(source);
        }

        // Maintain line count for \n in source.
        var n = 0;
        while (~(n = source.indexOf("\n", n))) {
          line++;
          n++;
        }

        i = end + closeTag.length - 1;
        openTag = nextOpenTag;
        closeTag = nextCloseTag;
      } else {
        c = template.substr(i, 1);

        if (c == '\r') {
          // Ignore carriage returns.
        } else {
          if (isWhitespace(c)) {
            spaces.push([node, node.children.length]);
          } else {
            nonSpace = true;
          }

          node.children.push({
            type: NODE_TYPES.TEXT
          , line: line
          , value: c
          });

          if (c == '\n') {
            stripSpace(); // Check for whitespace on the current line.
            line++;
          }
        }
      }
    }

    if (sectionStack.length != 0) {
      throw debug(new Error('Section "' + sectionStack[sectionStack.length - 1].name + '" was not closed properly'), template, line, options.file);
    }

    // Clean up any whitespace from a closing {{tag}} that was at the end
    // of the template without a trailing \n.
    stripSpace();
    return node;
  }

  /**
   * I can render a node.
   */
  function _renderNode(node, stack, partials) {
    var buffer = ""; // output buffer

    switch (node.type) {
      case NODE_TYPES.TEMPLATE:
        buffer = reduce(node.children, function (code, node) {
          return code + _renderNode(node, stack, partials);
        }, buffer);
        break;
      case NODE_TYPES.PARTIAL:
        var partial = partials[node.key];
        if (partial) {
          buffer = render(partial,stack[stack.length - 1],partials);
        }
        break;
      case NODE_TYPES.SECTION:
        var name = node.key;

        callback = reduce(node.children, function (code, node) {
          return function () {return code() + _renderNode(node, stack, partials)};
        }, function () {return ""});

        buffer = renderSection(name,stack,callback,node.inverted);
        break;
      case NODE_TYPES.PLAIN:
        buffer = lookup(node.key,stack,"");
        break;
      case NODE_TYPES.ESCAPED:
        buffer = escapeHTML(lookup(node.key,stack,""));
        break;
      case NODE_TYPES.TEXT:
        buffer = node.value;
        break;
      default:
        throw new Error("Unexpected node of type: " + node.type);
    }

    return buffer;
  }

  /**
   * Mostly `_renderNode`, this generates executable JavaScript code.
   */
  var _renderNodeSRC = _renderNode.toString();
  function _codeGen(node) {
    code = '';
    code += '(function () {\n'
    code += 'var node = ' + encodeJavaScriptData(node) + ';\n';
    code += _renderNodeSRC + '\n';
    code += 'return function (view, partials) {\n';
    code += '  return _renderNode(node, [view], partials);\n';
    code += '};\n';
    code += '}())';

    return code;
  }

  /**
   * Used by `compile` to generate a reusable function for the given `template`.
   */
  function _compile(template, options) {
    var node = parse(template, options);
    var fn;

    if (options.codeGen) {
      var body = _codeGen(node);
      if (options.debug) {
        if (typeof console != "undefined" && console.log) {
          console.log(body);
        } else if (typeof print === "function") {
          print(body);
        }
      }

      var args = "lookup,escapeHTML,renderSection,render,NODE_TYPES,reduce";
      fn = (new Function(args, 'return ' + body))(lookup,escapeHTML,renderSection,render,NODE_TYPES,reduce);
    } else {
      fn = function (view, partials) {
        return _renderNode(node, [view], partials);
      }
    }

    return function (view, partials) {
      return fn(view, partials || {});
    };
  }

  // Cache of pre-compiled templates.
  var _cache = {};

  /**
   * Clear the cache of compiled templates.
   */
  function clearCache() {
    _cache = {};
  }

  /**
   * Compiles the given `template` into a reusable function using the given
   * `options`. In addition to the options accepted by Mustache.parse,
   * recognized options include the following:
   *
   *   - cache    Set `false` to bypass any pre-compiled version of the given
   *              template. Otherwise, a given `template` string will be cached
   *              the first time it is parsed
   *   - codeGen  Set `true` and the generated function will be build from
   *              JavaScript code.
   *   - debug    Set `true` to log the body of the generated function to the
   *              console
   */
  function compile(template, options) {
    options = options || {};

    // Use a pre-compiled version from the cache if we have one.
    if (options.cache !== false) {
      if (!_cache[template]) {
        _cache[template] = _compile(template, options);
      }

      return _cache[template];
    }

    return _compile(template, options);
  }

  /**
   * High-level function that renders the given `template` using the given
   * `view` and `partials`. If you need to use any of the template options (see
   * `compile` above), you must compile in a separate step, and then call that
   * compiled function.
   */
  function render(template, view, partials) {
    return compile(template)(view, partials);
  }

})(Mustache);
