/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = (function(undefined) {
	var splitFunc = (function() {
		// Fix up the stupidness that is IE's split implementation
		var compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
		function capturingSplit(separator) {
			// fix up the stupidness that is IE's broken String.split implementation
			// originally by Steven Levithan
			/* Cross-Browser Split 1.0.1
			(c) Steven Levithan <stevenlevithan.com>; MIT License
			An ECMA-compliant, uniform cross-browser split method */
			var str = this;
			var limit = undefined;
			
			// if `separator` is not a regex, use the native `split`
			if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
				return String.prototype.split.call(str, separator, limit);
			}

			var output = [],
				lastLastIndex = 0,
				flags = (separator.ignoreCase ? "i" : "") +
						(separator.multiline  ? "m" : "") +
						(separator.sticky     ? "y" : ""),
				separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
				separator2, match, lastIndex, lastLength;

			str = str + ""; // type conversion
			if (!compliantExecNpcg) {
				separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
			}

			/* behavior for `limit`: if it's...
			- `undefined`: no limit.
			- `NaN` or zero: return an empty array.
			- a positive number: use `Math.floor(limit)`.
			- a negative number: no limit.
			- other: type-convert, then use the above rules. */
			if (limit === undefined || +limit < 0) {
				limit = Infinity;
			} else {
				limit = Math.floor(+limit);
				if (!limit) {
					return [];
				}
			}

			while (match = separator.exec(str)) {
				lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

				if (lastIndex > lastLastIndex) {
					output.push(str.slice(lastLastIndex, match.index));

					// fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
					if (!compliantExecNpcg && match.length > 1) {
						match[0].replace(separator2, function () {
							for (var i = 1; i < arguments.length - 2; i++) {
								if (arguments[i] === undefined) {
									match[i] = undefined;
								}
							}
						});
					}

					if (match.length > 1 && match.index < str.length) {
						Array.prototype.push.apply(output, match.slice(1));
					}

					lastLength = match[0].length;
					lastLastIndex = lastIndex;

					if (output.length >= limit) {
						break;
					}
				}

				if (separator.lastIndex === match.index) {
					separator.lastIndex++; // avoid an infinite loop
				}
			}

			if (lastLastIndex === str.length) {
				if (lastLength || !separator.test("")) {
					output.push("");
				}
			} else {
				output.push(str.slice(lastLastIndex));
			}

			return output.length > limit ? output.slice(0, limit) : output;
		}
		
		if ('lal'.split(/(a)/).length !== 3) {
			return capturingSplit;
		} else {
			return String.prototype.split;
		}
	})();

	var escapeCompiledRegex;
	function escape_regex(text) {
		// thank you Simon Willison
		if (!escapeCompiledRegex) {
			var specials = [
				'/', '.', '*', '+', '?', '|',
				'(', ')', '[', ']', '{', '}', '\\'
			];
			escapeCompiledRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
		}
		
		return text.replace(escapeCompiledRegex, '\\$1');
	}
		
	function isWhitespace(token) {
		return token.match(/^\s+$/)!==null;
	}
	
	function isNewline(token) {
		return token.match(/\r?\n/)!==null;
	}

	function create_parser_context(template, partials, view, send_func, openTag, closeTag) {
		openTag = openTag || '{{';
		closeTag = closeTag || '}}';
		
		var tokenizer = new RegExp('(\\r?\\n)|(' + escape_regex(openTag) + '[!#\^\/&{>=]?\\s*\\S*?\\s*}?' + escape_regex(closeTag) + ')|(' + escape_regex(openTag) + '=\\S*\\s*\\S*=' + escape_regex(closeTag) + ')');
	
		var context =  {
			template: template || ''
			, partials: partials || {}
			, contextStack: [view || {}]
			, user_send_func: send_func
			, openTag: openTag
			, closeTag: closeTag
			, state: 'normal'
			, pragmas: {}
		};
		
		// prefilter pragmas
		pragmas(context);
		
		// tokenize and initialize a cursor
		context.tokens = splitFunc.call(context.template, tokenizer);
		context.cursor = 0;
		
		return context;
	}
	
	function is_function(a) {
		return a && typeof a === 'function';
	}
	
	function is_object(a) {
		return a && typeof a === 'object';
	}

	function is_array(a) {
		return Object.prototype.toString.call(a) === '[object Array]';
	}
	
	/*
	find `name` in current `context`. That is find me a value
	from the view object
	*/
	function find(name, context) {
		// Checks whether a value is truthy or false or 0
		function is_kinda_truthy(bool) {
			return bool === false || bool === 0 || bool;
		}
		
		var value;
		if (is_kinda_truthy(context[name])) {
			value = context[name];
		}

		if (is_function(value)) {
			return value.apply(context);
		}
		
		return value;
	}
	
	function find_in_stack(name, contextStack) {
		var value;
		
		value = find(name, contextStack[contextStack.length-1]);
		if (value!==undefined) { return value; }
		
		if (contextStack.length>1) {
			value = find(name, contextStack[0]);
			if (value!==undefined) { return value; }
		}
		
		return undefined;
	}

	function get_variable_name(parserContext, token, prefixes, postfixes) {
		var matches = token.match(new RegExp(escape_regex(parserContext.openTag) + 
			'[' + escape_regex((prefixes || []).join('')) + 
			']?\\s*(\\S*?)\\s*[' + 
			escape_regex((postfixes || []).join('')) + 
			']?' + 
			escape_regex(parserContext.closeTag)));
			
		if ((matches || []).length!==2) {
			throw new Error('Malformed mustache tag: ' + token);
		} else {
			return matches[1];
		}
	}
	
	function interpolate(parserContext, token, escape) {
		function escapeHTML(str) {
			return str.replace(/&/g,'&amp;')
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;');
		}
		
		var prefix = [], postfix = [];		
		if (escape==='{') {
			prefix = ['{'];
			postfix = ['}'];
		} else if (escape==='&') {
			prefix = ['&'];
		}
		
		var res = find_in_stack(get_variable_name(parserContext, token, prefix, postfix), parserContext.contextStack);
		if (res!==undefined) {
			if (!escape) {
				res = escapeHTML('' + res);
			}
			
			parserContext.user_send_func('' + res);
		}
	}
	
	function partial(parserContext, token) {
		var variable = get_variable_name(parserContext, token, ['>']);
		
		var value = find_in_stack(variable, parserContext.contextStack);
		
		var new_parser_context = create_parser_context(
			parserContext.partials[variable] || ''
			, parserContext.partials
			, null
			, parserContext.user_send_func);
			
		new_parser_context.contextStack = parserContext.contextStack;

		if (value) {
			// TODO: According to mustache-spec, partials do not act as implicit sections
			// this behaviour was carried over from janl's mustache and should either
			// be discarded or replaced with a pragma
			new_parser_context.contextStack.push(value);
		}

		parse(new_parser_context);
		
		if (value) {
			// TODO: See above
			new_parser_context.contextStack.pop();
		}
	}
	
	function section(parserContext) {
		function create_section_context(s) {
			var context = create_parser_context(s.template_buffer.join(''), 
				parserContext.partials, 
				null, 
				parserContext.user_send_func,
				parserContext.openTag,
				parserContext.closeTag);
			
			context.contextStack = parserContext.contextStack;
			
			return context;
		}
		
		// by @langalex, support for arrays of strings
		function create_context(_context) {
			if(is_object(_context)) {
				return _context;
			} else {
				var ctx = {}, 
					iterator = (parserContext.pragmas['IMPLICIT-ITERATOR'] || {iterator: '.'}).iterator;
				
				ctx[iterator] = _context;
				
				return ctx;
			}
		}		
		
		var s = parserContext.section;
		var value = find_in_stack(s.variable, parserContext.contextStack);
		var i, n;
		var new_parser_context;
		
		if (s.inverted) {
			if (!value || is_array(value) && value.length === 0) { // false or empty list, render it
				new_parser_context = create_section_context(s);
				parse(new_parser_context);
			}
		} else {
			if (is_array(value)) { // Enumerable, Let's loop!
				new_parser_context = create_section_context(s);
				
				for (i=0, n=value.length; i<n; ++i) {
					new_parser_context.cursor = 0;
					new_parser_context.contextStack.push(create_context(value[i]));
					parse(new_parser_context);
					new_parser_context.contextStack.pop();
				}
			} else if (is_object(value)) { // Object, Use it as subcontext!
				new_parser_context = create_section_context(s);
				
				new_parser_context.contextStack.push(value);
				parse(new_parser_context);
				new_parser_context.contextStack.pop();
			} else if (is_function(value)) { // higher order section
				// TODO: Implement
			} else if (value) { // truthy
				new_parser_context = create_section_context(s);
				parse(new_parser_context);
			}
		}
	}
	
	function pragmas(parserContext) {
		/* includes tag */
		function includes(needle, haystack) {
			return haystack.indexOf('{{' + needle) !== -1;
		}
		
		var directives = {
			'IMPLICIT-ITERATOR': function(options) {
				parserContext.pragmas['IMPLICIT-ITERATOR'] = {};
				
				if (options) {
					parserContext.pragmas['IMPLICIT-ITERATOR'].iterator = options['iterator'];
				}
			}
		};
		
		// no pragmas, easy escape
		if(!includes("%", parserContext.template)) {
			return parserContext.template;
		}

		var regex = /{{%([\\w-]+)(\\s*)(.*?(?=}}))}}/;
		return parserContext.template.replace(regex, function(match, pragma, space, suffix) {
			var options = undefined;
			
			if (suffix.length>0) {
				var optionPairs = suffix.split(',');
				var scratch;
				
				options = {};
				for (var i=0, n=optionPairs.length; i<n; ++i) {
					scratch = optionPairs[i].split('=');
					if (scratch.length !== 2) {
						throw new Error('Malformed pragma options:' + optionPairs[i]);
					}
					options[scratch[0]] = scratch[1];
				}
			}
			
			if (is_function(directives[pragma])) {
				directives[pragma](options);
			} else {
				throw new Error('This implementation of mustache does not implement the "' + pragma + '" pragma');
			}

			return ''; // blank out all pragmas
		});
	}
	
	function change_delimiter(parserContext, token) {
		var matches = token.match(new RegExp(escape_regex(parserContext.openTag) + '=(\\S*?)\\s*(\\S*?)=' + escape_regex(parserContext.closeTag)));

		if ((matches || []).length!==3) {
			throw new Error('Malformed change delimiter token: ' + token);
		}
		
		var context = create_parser_context(
			parserContext.tokens.slice(parserContext.cursor+1).join('')
			, parserContext.partials
			, null
			, parserContext.user_send_func
			, matches[1]
			, matches[2]);

		context.contextStack = parserContext.contextStack;
			
		parserContext.cursor = parserContext.tokens.length; // finish off this level
		
		parse(context);
	}
	
	function begin_section(parserContext, token, inverted) {
		var variable = get_variable_name(parserContext, token, ['#', '^']);
		if (parserContext.state==='normal') {
			parserContext.state = 'scan_section';
			parserContext.section = {
				variable: variable
				, template_buffer: []
				, inverted: inverted
				, child_sections: []
			};
		} else {
			parserContext.section.child_sections.push(variable);
			parserContext.section.template_buffer.push(token);
		}
	}
	
	function end_section(parserContext, token) {
		var variable = get_variable_name(parserContext, token, ['/']);
		
		if (parserContext.section.child_sections.length > 0 && 
			parserContext.section.child_sections[parserContext.section.child_sections.length-1] === variable) {
			
			parserContext.section.child_sections.pop();			
			parserContext.section.template_buffer.push(token);			
		} else if (parserContext.section.variable===variable) {
			section(parserContext);
			delete parserContext.section;
			parserContext.state = 'normal';
		} else {
			throw new Error('Unexpected section end tag. Expected: ' + parserContext.section.variable);
		}
	}
	
	function parse(parserContext) {
		var n, token;
		
		for (n = parserContext.tokens.length;parserContext.cursor<n;++parserContext.cursor) {
			token = parserContext.tokens[parserContext.cursor];
			if (token==='') {
				continue;
			}
			
			stateMachine[parserContext.state](parserContext, token);
		}
	}
	
	var stateMachine = {
		'normal': function(parserContext, token) {
			if (token.indexOf(parserContext.openTag)===0) {
				// the token has the makings of a Mustache tag
				// perform the appropriate action based on the state machine
				switch (token.charAt(parserContext.openTag.length)) {
					case '!': // comment
						// comments are just discarded, nothing to do
						break;
					case '#': // section
						begin_section(parserContext, token, false);
						break;
					case '^': // inverted section
						begin_section(parserContext, token, true);
						break;
					case '/': // end section
						// in normal flow, this operation is absolutely meaningless
						throw new Error('Unbalanced End Section tag: ' + token);
						break;
					case '&': // unescaped variable						
					case '{': // unescaped variable
						interpolate(parserContext, token, token.charAt(parserContext.openTag.length));
						break;
					case '>': // partial
						partial(parserContext, token);
						break;
					case '=': // set delimiter change
						change_delimiter(parserContext, token);
						break;
					default: // escaped variable
						interpolate(parserContext, token);
						break;
				}				
			} else {
				// plain jane text
				parserContext.user_send_func(token);
			}		
		}
		, 'scan_section': function(parserContext, token) {
			if (token.indexOf(parserContext.openTag)===0) {		
				switch (token.charAt(parserContext.openTag.length)) {
					case '!': // comments
						// comments are just discarded, nothing to do
						break;
					case '#': // section
						begin_section(parserContext, token, false);
						break;
					case '^': // inverted section
						begin_section(parserContext, token, true);
						break;						
					case '/': // end section
						end_section(parserContext, token);
						break;
					case '=': // set delimiter change
						change_delimiter(parserContext, token);
						break;
					default: // all others
						parserContext.section.template_buffer.push(token);
						break;
				}
			} else {
				parserContext.section.template_buffer.push(token);
			}
		}
	}
	
	return({
		name: "mustache.js",
		version: "0.5.0-vcs",

		/*
		Turns a template and view into HTML
		*/
		to_html: function(template, view, partials, send_func) {
			var o = [];
			var user_send_func = send_func || function(str) {
				o.push(str);
			};
			
			parse(create_parser_context(template, partials, view, user_send_func));
			
			if (!send_func) {
				return o.join('');
			}
		},
	});
})();
