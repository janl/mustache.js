/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
  
  This implementation adds a template compiler for faster processing and fixes bugs.
  See http://www.saliences.com/projects/mustache/mustache.html for details.
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

	/* BEGIN Helpers */
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
	
	function is_newline(token) {
		return token.match(/\r?\n/);
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

	var MustacheError = function(message, metrics) {
		var str = '';

		this.prototype = Error.prototype;
		this.name = 'MustacheError';
		
		if (metrics) {
			str = '(' + metrics.line + ',' + metrics.character + '): ';
			if (metrics.partial) {
				str = '[' + metrics.partial + ']' + str;
			}
		}
		
		this.message = str + message;		
		if (metrics) {
			this.line = metrics.line;
			this.character = metrics.character;
			this.partial = metrics.partial;
		}
	};
	
	/* END Helpers */

	/* BEGIN Compiler */
		
	function compile(state, noReturn) {
		var n, c, token;
		
		for (n = state.tokens.length;state.cursor<n && !state.terminated;++state.cursor) {
			token = state.tokens[state.cursor];
			if (token==='' || token===undefined) {
				continue;
			}
			
			if (token.indexOf(state.openTag)===0) {
				c = token.charAt(state.openTag.length);
				if (state.parser[c]) {
					state.parser[c](state, token, c);
				} else {
					state.parser.def(state, token);
				}
			} else {
				state.parser.text(state, token);
			}
			
			if (is_newline(token)) {
				state.metrics.character = 1;
				state.metrics.line++;
			} else {
				state.metrics.character+=token.length;
			}
		}
		
		if (state.parser === scan_section_parser && !state.terminated) {
			throw new MustacheError('Closing section tag "' + state.section.variable + '" expected.', state.metrics);
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
	
	var default_tokenizer = /(\r?\n)|({{![\s\S]*?!}})|({{[#\^\/&>]?\s*[^!{=]\S*?\s*}})|({{{\s*\S*?\s*}}})|({{=\S*?\s*\S*?=}})/;
	function create_compiler_state(template, partials, openTag, closeTag) {
		openTag = openTag || '{{';
		closeTag = closeTag || '}}';

		var tokenizier;		
		if (openTag === '{{' && closeTag === '}}') {
			tokenizer = default_tokenizer;
		} else {
			var rOTag = escape_regex(openTag),
				rETag = escape_regex(closeTag);

			var parts = [
				'(\\r?\\n)' // new lines
				, '(' + rOTag + '![\\s\\S]*?!' + rETag + ')' // comments
				, '(' + rOTag + '[#\^\/&>]?\\s*[^!{=]\\S*?\\s*' + rETag + ')' // all other tags
				, '(' + rOTag + '{\\s*\\S*?\\s*}' + rETag + ')' // { unescape token
				, '(' + rOTag + '=\\S*?\\s*\\S*?=' + rETag + ')' // set delimiter change
			];
			tokenizer = new RegExp(parts.join('|'));
		}

		var code = [], state =  {
			metrics: {
				partial: null
				, line: 1
				, character: 1
			}
			, template: template || ''
			, partials: partials || {}
			, openTag: openTag
			, closeTag: closeTag
			, parser: default_parser
			, pragmas: {}
			, code: code
			, send_code_func: function(f) {
				code.push(f);
			}
		};
		
		pragmas(state); // use pragmas to control parsing behaviour
		
		// tokenize and initialize a cursor
		state.tokens = splitFunc.call(state.template, tokenizer);
		state.cursor = 0;
		
		return state;
	}
	
	var pragma_directives = {
		'IMPLICIT-ITERATOR': function(state, options) {
			state.pragmas['IMPLICIT-ITERATOR'] = {iterator: ((options || {iterator:undefined}).iterator) || '.'};
		}
	};
		
	function pragmas(state) {
		/* includes tag */
		function includes(needle, haystack) {
			return haystack.indexOf('{{' + needle) !== -1;
		}
		
		// no pragmas, easy escape
		if(!includes("%", state.template)) {
			return state.template;
		}

		state.template = state.template.replace(/{{%([\w-]+)(\s*)(.*?(?=}}))}}/g, function(match, pragma, space, suffix) {
			var options = undefined,
				optionPairs, scratch,
				i, n;
			
			if (suffix.length>0) {
				optionPairs = suffix.split(',');
				
				options = {};
				for (i=0, n=optionPairs.length; i<n; ++i) {
					scratch = optionPairs[i].split('=');
					if (scratch.length !== 2) {
						throw new MustacheError('Malformed pragma option "' + optionPairs[i] + '".');
					}
					options[scratch[0]] = scratch[1];
				}
			}
			
			if (is_function(pragma_directives[pragma])) {
				pragma_directives[pragma](state, options);
			} else {
				throw new MustacheError('This implementation of mustache does not implement the "' + pragma + '" pragma.', undefined);
			}

			return ''; // blank out all pragmas
		});
	}
	
	/* END Compiler */
	
	/* BEGIN Run Time Helpers */
	
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
	
	function find_in_stack(name, context_stack) {
		var value;
				
		value = find(name, context_stack[context_stack.length-1]);
		if (value!==undefined) { return value; }
		
		if (context_stack.length>1) {
			value = find(name, context_stack[0]);
			if (value!==undefined) { return value; }
		}
		
		return undefined;
	}
	
	function find_with_dot_notation(name, context) {
		var name_components = name.split('.'),
			i = 1, n = name_components.length,
			value = find_in_stack(name_components[0], context);
			
		while (value && i<n) {
			value = find(name_components[i], value);
			i++;
		}
	
		if (i!==n && !value) {
			value = undefined;
		}
		
		return value;
	}
	
	/* END Run Time Helpers */

	function text(state, token) {
		state.send_code_func(function(context, send_func) { send_func(token); });	
	}
	
	function interpolate(state, token, mark) {
		function escapeHTML(str) {
			return str.replace(/&/g,'&amp;')
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;');
		}
		
		var escape, prefix, postfix;
		if (mark==='{') {
			escape = prefix = postfix = true;
		} else if (mark==='&') {
			escape = prefix = true;
		}
		
		var variable = get_variable_name(state, token, prefix, postfix),
			implicit_iterator = (state.pragmas['IMPLICIT-ITERATOR'] || {iterator: '.'}).iterator;
		
		state.send_code_func((function(variable, escape) { return function(context, send_func) {
			var value;
			
			if ( variable === implicit_iterator ) { // special case for implicit iterator (usually '.')
				value = {}; value[implicit_iterator] = context[context.length-1];
				value = find(variable, value);
			} else {
				value = find_with_dot_notation(variable, context);
			}

			if (value!==undefined) {
				if (!escape) {
					value = escapeHTML('' + value);
				}
				
				send_func('' + value);
			}
		};})(variable, escape));
	}
	
	function partial(state, token) {
		var variable = get_variable_name(state, token, true),
			template, program;
		
		if (!state.partials[variable]) {
			throw new MustacheError('Unknown partial "' + variable + '".', state.metrics);
		}
		
		if (!is_function(state.partials[variable])) {
			// if the partial has not been compiled yet, do so now
			
			template = state.partials[variable]; // remember what the partial was
			state.partials[variable] = noop; // avoid infinite recursion
			
			var new_state = create_compiler_state(
				template
				, state.partials				
			);
			new_state.metrics.partial = variable;
			// TODO: Determine if partials should inherit pragma state from parent
			program = compile(new_state);
			
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
		var s = state.section, template = s.template_buffer.join(''),
			program, 
			new_state = create_compiler_state(template, state.partials, state.openTag, state.closeTag);
		
		new_state.metrics = s.metrics;
		new_state.pragmas = state.pragmas;
		program = compile(new_state);
		
		if (s.inverted) {
			state.send_code_func((function(program, variable){ return function(context, send_func) {
				var value = find_with_dot_notation(variable, context);
				if (!value || is_array(value) && value.length === 0) { // false or empty list, render it
					program(context, send_func);
				}
			};})(program, s.variable));
		} else {
			state.send_code_func((function(program, variable, template, partials){ return function(context, send_func) {
				var value = find_with_dot_notation(variable, context);
				if (is_array(value)) { // Enumerable, Let's loop!
					for (var i=0, n=value.length; i<n; ++i) {
						context.push(value[i]);
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
					
						var new_state = create_compiler_state(hosFragment, partials);
						new_state.metrics.partial = 'HOS@@anon';
						compile(new_state)(context, user_send_func);
						
						return o.join('');
					}));
				} else if (value) { // truthy
					program(context, send_func);
				}
			};})(program, s.variable, template, state.partials));
		}
	}

	/* BEGIN Parser */
	
	var default_parser = {
		'!': noop,
		'#': begin_section,
		'^': begin_section,
		'/': function(state, token) { throw new MustacheError('Unbalanced End Section tag "' + token + '".', state.metrics); },
		'&': interpolate,
		'{': interpolate,
		'>': partial,
		'=': change_delimiter,
		def: interpolate,
		text: text
	};
	
	var scan_section_parser = {
		'!': noop,
		'#': begin_section,
		'^': begin_section,
		'/': end_section,
		'&': buffer_section,
		'{': buffer_section,
		'>': buffer_section,
		'=': change_delimiter,		
		def: buffer_section,
		text: buffer_section
	};
		
	function get_variable_name(state, token, prefix, postfix) {
		var fragment = token.substring(
			state.openTag.length + (prefix ? 1 : 0)
			, token.length - state.closeTag.length - (postfix ? 1 : 0)
		);
		
		if (String.prototype.trim) {
			fragment = fragment.trim();
		} else {
			fragment = fragment.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
		
		if (fragment.indexOf(' ')!==-1) {
			throw new MustacheError('Malformed variable name "' + fragment + '".', state.metrics);
		}
		
		return fragment;
	}
	
	function change_delimiter(state, token) {
		var matches = token.match(new RegExp(escape_regex(state.openTag) + '=(\\S*?)\\s*(\\S*?)=' + escape_regex(state.closeTag)));

		if ((matches || []).length!==3) {
			throw new MustacheError('Malformed change delimiter token "' + token + '".', state.metrics);
		}
		
		var new_state = create_compiler_state(
			state.tokens.slice(state.cursor+1).join('')
			, state.partials
			, matches[1]
			, matches[2]);
		new_state.code = state.code;
		new_state.send_code_func = state.send_code_func;
		new_state.parser = state.parser;
		new_state.metrics.line = state.metrics.line;
		new_state.metrics.character = state.metrics.character + token.length;
		new_state.metrics.partial = state.metrics.partial;
		new_state.section = state.section;
		new_state.pragmas = state.pragmas;
		if (new_state.section) {
			new_state.section.template_buffer.push(token);
		}
		
		state.terminated = true; // finish off this level
		
		compile(new_state, true);
	}
	
	function begin_section(state, token, mark) {
		var inverted = mark === '^', 
			variable = get_variable_name(state, token, true);
		
		if (state.parser===default_parser) {
			state.parser = scan_section_parser;
			state.section = {
				variable: variable
				, template_buffer: []
				, inverted: inverted
				, child_sections: []
				, metrics: {
					partial: state.metrics.partial
					, line: state.metrics.line
					, character: state.metrics.character + token.length
				}
			};
		} else {
			state.section.child_sections.push(variable);
			state.section.template_buffer.push(token);
		}
	}
	
	function buffer_section(state, token) {
		state.section.template_buffer.push(token);
	}
	
	function end_section(state, token) {
		var variable = get_variable_name(state, token, true);
		
		if (state.section.child_sections.length > 0) {
			var child_section = state.section.child_sections[state.section.child_sections.length-1];
			if (child_section === variable) {
				state.section.child_sections.pop();			
				state.section.template_buffer.push(token);
			} else {
				throw new MustacheError('Unexpected section end tag "' + variable + '", expected "' + child_section + '".', state.metrics);
			}
		} else if (state.section.variable===variable) {
			section(state);
			delete state.section;
			state.parser = default_parser;
		} else {
			throw new MustacheError('Unexpected section end tag "' + variable + '", expected "' + state.section.variable + '".', state.metrics);
		}
	}
		
	/* END Parser */
	
	return({
		name: "mustache.js",
		version: "0.5.1-vcs",

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
		
			var program = compile(create_compiler_state(template, p));
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
		},
		
		Error: MustacheError
	});
})();
