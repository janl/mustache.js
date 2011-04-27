/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = (function(undefined) {
	var splitFunc = (function() {
		// fix up the stupidness that is IE's broken String.split implementation
		/* Cross-Browser Split 1.0.1
		(c) Steven Levithan <stevenlevithan.com>; MIT License
		An ECMA-compliant, uniform cross-browser split method 
		*/
		var compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
		function capturingSplit(separator) {
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
		
		if ('lol'.split(/(o)/).length !== 3) {
			return capturingSplit;
		} else {
			return String.prototype.split;
		}
	})();

	function noop() {}
	
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

	var default_tokenizer = /(\r?\n)|({{![\s\S]*?!}})|({{[#\^\/&{>=]?\s*\S*?\s*}?}})|({{=\S*?\s*\S*?=}})/;
	function create_parser_state(template, partials, openTag, closeTag) {
		openTag = openTag || '{{';
		closeTag = closeTag || '}}';

		var tokenizier;		
		if (openTag === '{{' && closeTag === '}}') {
			tokenizer = default_tokenizer;
		} else {
			var rOTag = escape_regex(openTag),
				rETag = escape_regex(closeTag);

			tokenizer = new RegExp('(\\r?\\n)|(' + rOTag + '![\\s\\S]*?!' + rETag + ')|(' + rOTag + '[#\^\/&{>=]?\\s*\\S*?\\s*}?' + rETag + ')|(' + rOTag + '=\\S*?\\s*\\S*?=' + rETag + ')');
		}
	
		var code = [];
		var context =  {
			template: template || ''
			, partials: partials || {}
			, openTag: openTag
			, closeTag: closeTag
			, state: 'normal'
			, pragmas: {}
			, code: code
			, send_code_func: function(f) {
				code.push(f);
			}
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

	function get_variable_name(state, token, prefix, postfix) {
		var fragment = token
			.substring(
				state.openTag.length + (prefix ? 1 : 0)
				, token.length - state.closeTag.length - (postfix ? 1 : 0)
			);
			
		if (String.prototype.trim) {
			return fragment.trim();
		} else {
			return fragment.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
	}
	
	function interpolate(state, token, escape) {
		function escapeHTML(str) {
			return str.replace(/&/g,'&amp;')
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;');
		}
		
		var prefix, postfix;
		if (escape==='{') {
			prefix = postfix = true;
		} else if (escape==='&') {
			prefix = true;
		}
		
		var variable = get_variable_name(state, token, prefix, postfix);
		state.send_code_func((function(variable, escape) { return function(context, send_func) {
			var res = find_in_stack(variable, context);
			if (res!==undefined) {
				if (!escape) {
					res = escapeHTML('' + res);
				}
				
				send_func('' + res);
			}
		};})(variable, escape));
	}
	
	function partial(state, token) {
		var variable = get_variable_name(state, token, true),
			template, program;
		
		if (!state.partials[variable]) {
			throw new Error('Unknown partial \'' + variable + '\'');
		}
		
		if (!is_function(state.partials[variable])) {
			// if the partial has not been compiled yet, do so now
			
			template = state.partials[variable]; // remember what the partial was
			state.partials[variable] = noop; // avoid infinite recursion
			
			program = parse(create_parser_state(
				template
				, state.partials
			));
			
			state.partials[variable] = function(context, send_func) {
				var value = find_in_stack(variable, context);

				if (value) {
					// TODO: According to mustache-spec, partials do not act as implicit sections
					// this behaviour was carried over from janl's mustache and should either
					// be discarded or replaced with a pragma
					context.push(value);
				}

				program(context, send_func);
				
				if (value) {
					// TODO: See above
					context.pop();
				}
			};
		}
		
		state.send_code_func(function(context, send_func) { state.partials[variable](context, send_func); });
	}
	
	function section(state) {
		function create_section_state(template) {
			return create_parser_state(template, 
				state.partials, 
				state.openTag,
				state.closeTag);
		}
		
		// by @langalex, support for arrays of strings
		function create_context(_context) {
			if(is_object(_context)) {
				return _context;
			} else {
				var ctx = {}, 
					iterator = (state.pragmas['IMPLICIT-ITERATOR'] || {iterator: '.'}).iterator;
				
				ctx[iterator] = _context;
				
				return ctx;
			}
		}		
		
		var s = state.section, template = s.template_buffer.join('')
			program = parse(create_section_state(template));
		
		if (s.inverted) {
			state.send_code_func((function(program, variable){ return function(context, send_func) {
				var value = find_in_stack(variable, context);
				if (!value || is_array(value) && value.length === 0) { // false or empty list, render it
					program(context, send_func);
				}
			};})(program, s.variable));
		} else {
			state.send_code_func((function(program, variable, template, partials){ return function(context, send_func) {
				var value = find_in_stack(variable, context);			
				if (is_array(value)) { // Enumerable, Let's loop!
					for (var i=0, n=value.length; i<n; ++i) {
						context.push(create_context(value[i]));
						program(context, send_func);
						context.pop();
					}
				} else if (is_object(value)) { // Object, Use it as subcontext!
					context.push(value);
					program(context, send_func);
					context.pop();
				} else if (is_function(value)) { // higher order section
					// note that HOS triggers a compilation on the hosFragment.
					// this is slow (in relation to a fully compiled template) 
					// since it invokes a call to the parser
					send_func(value.call(context[context.length-1], template, function(hosFragment) {
						var o = [],
							user_send_func = function(str) { o.push(str); };
					
						parse(create_parser_state(hosFragment, partials))(context, user_send_func);
						
						return o.join('');
					}));
				} else if (value) { // truthy
					program(context, send_func);
				}
			};})(program, s.variable, template, state.partials));
		}
	}
	
	function pragmas(state) {
		/* includes tag */
		function includes(needle, haystack) {
			return haystack.indexOf('{{' + needle) !== -1;
		}
		
		var directives = {
			'IMPLICIT-ITERATOR': function(options) {
				state.pragmas['IMPLICIT-ITERATOR'] = {iterator: '.'};
				
				if (options) {
					state.pragmas['IMPLICIT-ITERATOR'].iterator = options['iterator'];
				}
			}
		};
		
		// no pragmas, easy escape
		if(!includes("%", state.template)) {
			return state.template;
		}

		state.template = state.template.replace(/{{%([\w-]+)(\s*)(.*?(?=}}))}}/, function(match, pragma, space, suffix) {
			var options = undefined,
				optionPairs, scratch,
				i, n;
			
			if (suffix.length>0) {
				optionPairs = suffix.split(',');
				scratch;
				
				options = {};
				for (i=0, n=optionPairs.length; i<n; ++i) {
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
	
	function change_delimiter(state, token) {
		var matches = token.match(new RegExp(escape_regex(state.openTag) + '=(\\S*?)\\s*(\\S*?)=' + escape_regex(state.closeTag)));

		if ((matches || []).length!==3) {
			throw new Error('Malformed change delimiter token: ' + token);
		}
		
		var context = create_parser_state(
			state.tokens.slice(state.cursor+1).join('')
			, state.partials
			, matches[1]
			, matches[2]);
		context.code = state.code;
		context.send_code_func = state.send_code_func;
			
		state.cursor = state.tokens.length; // finish off this level
		
		parse(context, true);
	}
	
	function begin_section(state, token, inverted) {
		var variable = get_variable_name(state, token, true);
		
		if (state.state==='normal') {
			state.state = 'scan_section';
			state.section = {
				variable: variable
				, template_buffer: []
				, inverted: inverted
				, child_sections: []
			};
		} else {
			state.section.child_sections.push(variable);
			state.section.template_buffer.push(token);
		}
	}
	
	function end_section(state, token) {
		var variable = get_variable_name(state, token, true);
		
		if (state.section.child_sections.length > 0 && 
			state.section.child_sections[state.section.child_sections.length-1] === variable) {
			
			state.section.child_sections.pop();			
			state.section.template_buffer.push(token);			
		} else if (state.section.variable===variable) {
			section(state);
			delete state.section;
			state.state = 'normal';
		} else {
			throw new Error('Unexpected section end tag. Expected: ' + state.section.variable);
		}
	}
	
	function parse(state, noReturn) {
		var n, token;
		
		for (n = state.tokens.length;state.cursor<n;++state.cursor) {
			token = state.tokens[state.cursor];
			if (token==='' || token===undefined) {
				continue;
			}
			
			stateMachine[state.state](state, token);
		}
		
		if (!noReturn) {
			var codeList = state.code;
			if (codeList.length === 0) {
				return noop;
			} else if (codeList.length === 1) {
				return codeList[0];
			} else {
				return function(context, send_func) {
					for (var i=0,n=codeList.length;i<n;++i) {
						codeList[i](context, send_func);
					}
				}
			}
		}
	}
	
	var stateMachine = {
		'normal': function(state, token) {
			if (token.indexOf(state.openTag)===0) {
				// the token has the makings of a Mustache tag
				// perform the appropriate action based on the state machine
				switch (token.charAt(state.openTag.length)) {
					case '!': // comment
						// comments are just discarded, nothing to do
						break;
					case '#': // section
						begin_section(state, token, false);
						break;
					case '^': // inverted section
						begin_section(state, token, true);
						break;
					case '/': // end section
						// in normal flow, this operation is absolutely meaningless
						throw new Error('Unbalanced End Section tag: ' + token);
					case '&': // unescaped variable						
					case '{': // unescaped variable
						interpolate(state, token, token.charAt(state.openTag.length));
						break;
					case '>': // partial
						partial(state, token);
						break;
					case '=': // set delimiter change
						change_delimiter(state, token);
						break;
					default: // escaped variable
						interpolate(state, token);
						break;
				}				
			} else {
				// plain jane text
				state.send_code_func(function(view, send_func) { send_func(token); });
			}		
		}
		, 'scan_section': function(state, token) {
			if (token.indexOf(state.openTag)===0) {		
				switch (token.charAt(state.openTag.length)) {
					case '!': // comments
						// comments are just discarded, nothing to do
						break;
					case '#': // section
						begin_section(state, token, false);
						break;
					case '^': // inverted section
						begin_section(state, token, true);
						break;						
					case '/': // end section
						end_section(state, token);
						break;
					case '=': // set delimiter change
						change_delimiter(state, token);
						break;
					default: // all others
						state.section.template_buffer.push(token);
						break;
				}
			} else {
				state.section.template_buffer.push(token);
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
			var program = Mustache.compile(template, partials),
				result = program(view, send_func);
			
			if (!send_func) {
				return result;
			}
		},
		
		compile: function(template, partials) {
			var p = {};
			if (partials) {
				for (var key in partials) {
					if (partials.hasOwnProperty(key)) {
						p[key] = partials[key];
					}
				}
			}
		
			var program = parse(create_parser_state(template, p));
			return function(view, send_func) {
				var o = [],
					user_send_func = send_func || function(str) {
						o.push(str);
					};
					
				program([view || {}], user_send_func);
				
				if (!send_func) {
					return o.join('');
				}
			}
		}
	});
})();
