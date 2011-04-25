/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
  
  This implementation adds a template compiler for faster processing and fixes bugs.
  See http://www.saliences.com/projects/mustache/mustache.html for details.
*/

var Mustache = function() {
	function ParserException(message) { 
		this.message = message;
	}
	ParserException.prototype = {};
	
	var Renderer = function(send_func) {
		this._escapeCompiledRegex = null;
		if (!Renderer.TokenizerRegex) {
			Renderer.TokenizerRegex = this._createTokenizerRegex('{{', '}}');
		}
		
		this.user_send_func = send_func;
		this.commandSet = this.compiler;
		
		this.cached_output = [];
		this.send_func = function(text) {
			this.cached_output.push(text);
		}
		
		this.pragmas = {};
		
		// Fix up the stupidness that is IE's split implementation
		this._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
		var hasCapturingSplit = '{{hi}}'.split(/(hi)/).length === 3;
		if (!hasCapturingSplit) {
			this.splitFunc = this.capturingSplit;
		} else {
			this.splitFunc = String.prototype.split;
		}
	};
	Renderer.TokenizerRegex = null;
	
	Renderer.prototype = {
		capturingSplit: function(separator) {
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
			if (!this._compliantExecNpcg) {
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
					if (!this._compliantExecNpcg && match.length > 1) {
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
		},
		
		render: function(template, partials) {
			template = this.parse_pragmas(template, '{{', '}}');
			
			var tokens = this.tokenize(template, '{{', '}}');
			
			this.parse(this.createParserContext(tokens, partials, '{{', '}}'));
		},
		
		createParserContext: function(tokens, partials, openTag, closeTag) {
			return {
				tokens: tokens,
				token: tokens[0],
				index: 0,
				length: tokens.length,
				partials: partials,
				stack: [],
				openTag: openTag,
				closeTag: closeTag
			};
		},
		
		_createTokenizerRegex: function(openTag, closeTag) {
			var delimiters = [
				'\\{',
				'&',
				'\\}',
				'#',
				'\\^',
				'\\/',
				'>',
				'=',
				'%',
				'!',
				'\\s+'
			];
			delimiters.unshift(this.escape_regex(openTag));
			delimiters.unshift(this.escape_regex(closeTag));
			
			return new RegExp('(' + delimiters.join('|') + ')');
		},
		
		tokenize: function(template, openTag, closeTag) {
			var regex;			
			if (openTag==='{{' && closeTag==='}}') {
				// the common case, use the stored compiled regex
				regex = Renderer.TokenizerRegex;
			} else {
				regex = this._createTokenizerRegex(openTag, closeTag);
			}
			
			return this.splitFunc.call(template, regex);
		},
		
		/*
			Looks for %PRAGMAS
		*/
		parse_pragmas: function(template, openTag, closeTag) {
			/* includes tag */
			function includes(needle, haystack) {
				return haystack.indexOf(openTag + needle) !== -1;
			}	
			
			// no pragmas, easy escape
			if(!includes("%", template)) {
				return template;
			}

			var that = this;
			var regex = new RegExp(this.escape_regex(openTag) + "%([\\w-]+)(\\s*)(.*?(?=" + this.escape_regex(closeTag) + "))" + this.escape_regex(closeTag));
			return template.replace(regex, function(match, pragma, space, suffix) {
				var options = undefined;
				
				if (suffix.length>0) {
					var optionPairs = suffix.split(',');
					var scratch;
					
					options = {};
					for (var i=0, n=optionPairs.length; i<n; ++i) {
						scratch = optionPairs[i].split('=');
						if (scratch.length !== 2) {
							throw new ParserException('Malformed pragma options');
						}
						options[scratch[0]] = scratch[1];
					}
				}
				
				if (that.is_function(that.pragmaDirectives[pragma])) {
					that.pragmaDirectives[pragma].call(that, options);
				} else {
					throw new ParserException("This implementation of mustache doesn't understand the '" + pragma + "' pragma");
				}

				return ""; // blank out all pragmas
			});
		},
			
		parse: function(parserContext) {
			var state = 'text';
			
			for (; parserContext.index<parserContext.length; ++parserContext.index) {
				parserContext.token = parserContext.tokens[parserContext.index];
				
				if (parserContext.token === '') continue;
				
				state = this.stateMachine[state].call(this, parserContext);
			}
			
			// make sure the parser finished at an appropriate terminal state
			if (state!=='text') {
				this.stateMachine['endOfDoc'].call(this, parserContext);
			} else {
				this.commandSet.text.call(this);
			}
		},
		
		escape_regex: function(text) {
			// thank you Simon Willison
			if (!this._escapeCompiledRegex) {
				var specials = [
					'/', '.', '*', '+', '?', '|',
					'(', ')', '[', ']', '{', '}', '\\'
				];
				this._escapeCompiledRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
			}
			
			return text.replace(this._escapeCompiledRegex, '\\$1');
		},
	
		isWhitespace: function(token) {
			return token.match(/^\s+$/)!==null;
		},
		
		stateMachine: {
			text: function(parserContext) {
				switch (parserContext.token) {
					case parserContext.openTag:
						this.commandSet.text.call(this);
						
						return 'openMustache';
					default:
						this.send_func(parserContext.token);
						
						return 'text';
				}
			},
			openMustache: function(parserContext) {
				switch (parserContext.token) {
					case '{':
						parserContext.stack.push({tagType:'unescapedVariable', subtype: 'tripleMustache'});
						return 'keyName';
					case '&':
						parserContext.stack.push({tagType:'unescapedVariable'});
						return 'keyName';
					case '#':
						parserContext.stack.push({tagType:'section'});
						return 'keyName';
					case '^':
						parserContext.stack.push({tagType:'invertedSection'});
						return 'keyName';
					case '>':
						parserContext.stack.push({tagType:'partial'});
					
						return 'simpleKeyName';
					case '=':
						parserContext.stack.push({tagType: 'setDelimiter'});
						
						return 'setDelimiterStart';
					case '!':
						return 'discard';
					case '%':
						throw new ParserException('Pragmas are only supported as a preprocessing directive.');
					case '/': // close mustache
						throw new ParserException('Unexpected closing tag.');
					case '}': // close triple mustache
						throw new ParserException('Unexpected token encountered.');
					default:					
						parserContext.stack.push({tagType:'variable'});

						return this.stateMachine.keyName.call(this, parserContext);
				}
			},
			closeMustache: function(parserContext) {
				if (this.isWhitespace(parserContext.token)) {
					return 'closeMustache';
				} else if (parserContext.token===parserContext.closeTag) {
					return this.dispatchCommand(parserContext);
				}
			},
			expectClosingMustache: function(parserContext) {
				if (parserContext.closeTag==='}}' && 
					parserContext.token==='}}') {
					return 'expectClosingParenthesis';
				} else if (parserContext.token==='}') {
					return 'closeMustache';
				} else {
					throw new ParserException('Unexpected token encountered.');
				}
			},
			expectClosingParenthesis: function(parserContext) {
				if (parserContext.token==='}') {
					return this.dispatchCommand(parserContext);
				} else {
					throw new ParserException('Unexpected token encountered.');
				}
			},
			keyName: function(parserContext) {
				var result = this.stateMachine.simpleKeyName.call(this, parserContext);
				
				if (result==='closeMustache') {
					var tagKey = parserContext.stack[parserContext.stack.length-1],
						tag = parserContext.stack[parserContext.stack.length-2];
					
					if (tag.tagType==='unescapedVariable' && tag.subtype==='tripleMustache') {
						parserContext.stack[parserContext.stack.length-2] = {tagType:'unescapedVariable'};
						
						return 'expectClosingMustache';
					} else {
						return 'closeMustache';
					}
				} else if (result==='simpleKeyName') {
					return 'keyName';
				} else {
					throw new ParserException('Unexpected branch in tag name: ' + result);
				}
			},
			simpleKeyName: function(parserContext) {
				if (this.isWhitespace(parserContext.token)) {
					return 'simpleKeyName';
				} else {
					parserContext.stack.push(parserContext.token);
					
					return 'closeMustache';
				}
			},
			
			setDelimiterStart: function(parserContext) {
				if (this.isWhitespace(parserContext.token) ||
					parserContext.token==='=') {
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack.push(parserContext.token);
					return 'setDelimiterStartOrWhitespace';
				}				
			},
			setDelimiterStartOrWhitespace: function(parserContext) {
				if (this.isWhitespace(parserContext.token)) {
					return 'setDelimiterEnd';
				} else if (parserContext.token==='='){
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack[parserContext.stack.length-1] += parserContext.token;
					
					return 'setDelimiterStartOrWhitespace';
				}
			},
			setDelimiterEnd: function(parserContext) {
				if (this.isWhitespace(parserContext.token)) {
					return 'setDelimiterEnd';
				} else if (parserContext.token==='=') {
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack.push(parserContext.token);
				
					return 'setDelimiterEndOrEqualSign';
				}
			},
			setDelimiterEndOrEqualSign: function(parserContext) {
				if (parserContext.token==='=') {
					return 'setDelimiterExpectClosingTag';
				} else if (this.isWhitespace(parserContext.token)) {
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack[parserContext.stack.length-1] += parserContext.token;
					
					return 'setDelimiterEndOrEqualSign';
				}
			},
			setDelimiterExpectClosingTag: function(parserContext) {
				if (parserContext.token===parserContext.closeTag) {
					var newCloseTag = parserContext.stack.pop();
					var newOpenTag = parserContext.stack.pop();
					var command = parserContext.stack.pop();
					
					if (command.tagType!=='setDelimiter') {
						throw new ParserException('Syntax error in Set Delimiter tag');
					} else {
						var tokens = this.tokenize(
							parserContext.tokens.slice(parserContext.index+1).join(''),
							newOpenTag,
							newCloseTag);
							
						var newParserContext = this.createParserContext(tokens,
							parserContext.partials,
							newOpenTag,
							newCloseTag);

						parserContext.tokens = newParserContext.tokens;
						parserContext.index = -1;
						parserContext.length = newParserContext.length;
						parserContext.openTag = newParserContext.openTag;
						parserContext.closeTag = newParserContext.closeTag;
						
						return 'text';
					}
				} else {
					throw new ParserException('Syntax error in Set Delimiter tag');
				}
			},
			
			endSectionScan: function(parserContext) {
				switch (parserContext.token) {
					case parserContext.openTag:
						return 'expectSectionOrEndSection';
					default:
						parserContext.stack[parserContext.stack.length-1].content.push(parserContext.token);
						return 'endSectionScan';
				}
			},
			expectSectionOrEndSection: function(parserContext) {
				switch (parserContext.token) {
					case '#':
					case '^':
						parserContext.stack[parserContext.stack.length-1].depth++;
						parserContext.stack[parserContext.stack.length-1].content.push(parserContext.openTag, parserContext.token);
						return 'endSectionScan';
					case '/':
						parserContext.stack.push({tagType:'endSection'});
						return 'simpleKeyName';
					default:
						parserContext.stack[parserContext.stack.length-1].content.push(parserContext.openTag, parserContext.token);
						return 'endSectionScan';
				}
			},
			
			discard: function(parserContext) {
				if (parserContext.token==='!') {
					return 'closeComment';
				} else {
					return 'discard';
				}
			},
			
			closeComment: function(parserContext) {
				if (parserContext.token!==parserContext.closeTag) {
					return 'discard';
				} else {
					return 'text';
				}
			},
			
			endOfDoc: function(parserContext) {
				// eventually we may want to give better error messages
				throw new ParserException('Unexpected end of document.');
			}
		},

		dispatchCommand: function(parserContext) {			
			var key = parserContext.stack.pop();
			var command = parserContext.stack.pop();
			
			switch (command.tagType) {
				case 'section':
				case 'invertedSection':
					parserContext.stack.push({sectionType:command.tagType, key:key, content:[], depth:1});
					return 'endSectionScan';
				case 'variable':
					this.commandSet.variable.call(this, key);
					return 'text';
				case 'unescapedVariable':
					this.commandSet.unescaped_variable.call(this, key);
					return 'text';
				case 'partial':
					this.commandSet.partial.call(this, key,
						parserContext.partials,
						parserContext.openTag,
						parserContext.closeTag);
						
					return 'text';
				case 'endSection':
					var section = parserContext.stack[parserContext.stack.length-1];
					if (--section.depth === 0) {
						if (section.key === key) {
							parserContext.stack.pop();
							this.commandSet.section.call(this, section.sectionType,
								section.content,
								key,
								parserContext.partials,
								parserContext.openTag,
								parserContext.closeTag);
								
							return 'text';
						} else {
							throw new ParserException('Unbalanced open/close section tags');
						}
					} else {
						section.content.push('{{', '/', key, '}}');
						
						return 'endSectionScan';
					}
				default:
					throw new ParserException('Unknown dispatch command: ' + command.tagType);
			}
		},
		
		pragmaDirectives: {
			'IMPLICIT-ITERATOR': function(options) {
				this.pragmas['IMPLICIT-ITERATOR'] = {};
				
				if (options) {
					this.pragmas['IMPLICIT-ITERATOR'].iterator = options['iterator'];
				}
			}
		},
		
		/*
		find `name` in current `context`. That is find me a value
		from the view object
		*/
		find: function(name, context) {
			// Checks whether a value is truthy or false or 0
			function is_kinda_truthy(bool) {
				return bool === false || bool === 0 || bool;
			}

			var value;
			if (is_kinda_truthy(context[name])) {
				value = context[name];
			}

			if (this.is_function(value)) {
				return value.apply(context);
			}
			
			return value;
		},
		
		find_in_stack: function(name, contextStack) {
			var value;
			
			value = this.find(name, contextStack[contextStack.length-1]);
			if (value!==undefined) { return value; }
			
			if (contextStack.length>1) {
				value = this.find(name, contextStack[0]);
				if (value!==undefined) { return value; }
			}
			
			return undefined;
		},

		is_function: function(a) {
			return a && typeof a === 'function';
		},
		
		is_object: function(a) {
			return a && typeof a === 'object';
		},

		is_array: function(a) {
			return Object.prototype.toString.call(a) === '[object Array]';
		},	
		
		compiler: {
			text: function() {
				var outputText = this.cached_output.join('');
				this.cached_output = [];
				
				this.user_send_func(function(contextStack, send_func) {
					send_func(outputText);
				});
			},
			variable: function(key) {
				function escapeHTML(str) {
					return ('' + str).replace(/&/g,'&amp;')
						.replace(/</g,'&lt;')
						.replace(/>/g,'&gt;');
				}

				var that = this;
				this.user_send_func(function(contextStack, send_func) {
					var result = that.find_in_stack(key, contextStack);
					if (result!==undefined) {
						send_func(escapeHTML(result));
					}
				});
			},
			unescaped_variable: function(key) {
				var that = this;
				this.user_send_func(function(contextStack, send_func) {
					var result = that.find_in_stack(key, contextStack);
					if (result!==undefined) {
						send_func(result);
					}
				});
			},
			partial: function(key, partials, openTag, closeTag) {
				if (!partials || partials[key] === undefined) {
					throw new ParserException('Unknown partial \'' + key + '\'');
				}
				
				if (!this.is_function(partials[key])) {
					var old_user_send_func = this.user_send_func;
					var commands = [];
					this.user_send_func = function(command) { commands.push(command); };
					
					var tokens = this.tokenize(partials[key], openTag, closeTag);
					partials[key] = function() {}; // blank out the paritals so that infinite recursion doesn't happen
					this.parse(this.createParserContext(tokens, partials, openTag, closeTag));
				
					this.user_send_func = old_user_send_func;
					
					var that = this;
					partials[key] = function(contextStack, send_func) {
						var res = that.find_in_stack(key, contextStack),
							isObj = that.is_object(res);
						
						if (isObj) {
							contextStack.push(res);
						}
					
						for (var i=0,n=commands.length; i<n; ++i) {
							commands[i](contextStack, send_func);
						}
						
						if (isObj) {
							contextStack.pop();
						}
					};
				}
				
				this.user_send_func(function(contextStack, send_func) { partials[key](contextStack, send_func); });
			},
			section: function(sectionType, fragmentTokens, key, partials, openTag, closeTag) {
				// by @langalex, support for arrays of strings
				var that = this;
				function create_context(_context) {
					if(that.is_object(_context)) {
						return _context;
					} else {
						var iterator = '.';
						
						if(that.pragmas["IMPLICIT-ITERATOR"] &&
							that.pragmas["IMPLICIT-ITERATOR"].iterator) {
							iterator = that.pragmas["IMPLICIT-ITERATOR"].iterator;
						}
						var ctx = {};
						ctx[iterator] = _context;
						return ctx;
					}
				}
				
				var old_user_send_func = this.user_send_func;
				var commands = [];
				
				this.user_send_func = function(command) { commands.push(command); };
				
				this.parse(this.createParserContext(fragmentTokens, partials, openTag, closeTag));
				
				this.user_send_func = old_user_send_func;
				
				var section_command = function(contextStack, send_func) {
					for (var i=0, n=commands.length; i<n; ++i) {
						commands[i](contextStack, send_func);
					}
				};
				
				if (sectionType==='invertedSection') {
					this.user_send_func(function(contextStack, send_func) {
						var value = that.find_in_stack(key, contextStack);
						
						if (!value || that.is_array(value) && value.length === 0) {
							// false or empty list, render it
							section_command(contextStack, send_func);
						}
					});
				} else if (sectionType==='section') {
					this.user_send_func(function(contextStack, send_func) {
						var value = that.find_in_stack(key, contextStack);
						
						if (that.is_array(value)) { // Enumerable, Let's loop!
							for (var i=0, n=value.length; i<n; ++i) {
								contextStack.push(create_context(value[i]));
								section_command(contextStack, send_func);
								contextStack.pop();
							}
						} else if (that.is_object(value)) { // Object, Use it as subcontext!
							contextStack.push(value);
							section_command(contextStack, send_func);
							contextStack.pop();
						} else if (that.is_function(value)) {
							// higher order section
							// note that HOS triggers a compilation on the resultFragment.
							// this is slow (in relation to a fully compiled template) 
							// since it invokes a call to the parser
							var result = value.call(contextStack[contextStack.length-1], fragmentTokens.join(''), function(resultFragment) {
								var cO = [];
								var s = function(command) { cO.push(command); };
			
								var hos_renderer = new Renderer(s);

								resultFragment = hos_renderer.parse_pragmas(resultFragment, openTag, closeTag);
								var tokens = hos_renderer.tokenize(resultFragment, openTag, closeTag);
								hos_renderer.parse(hos_renderer.createParserContext(tokens, partials, openTag, closeTag));

								var o = [];
								var sT = function(output) { o.push(output); };
				
								for (var i=0,n=cO.length; i<n; ++i) {
									commands[i](contextStack, sT);
								}
				
								return o.join('');
							});
							
							send_func(result);
						} else if (value) {
							section_command(contextStack, send_func);
						}
					});
				} else {
					throw new ParserException('Unknown section type ' + sectionType);
				}
			}
		}
	}
	
	return({
		name: "mustache.js",
		version: "0.4.0-vcs",

		/*
		Turns a template and view into HTML
		*/
		to_html: function(template, view, partials, send_func) {
			return (Mustache.compile(template, partials))(view, send_func);
		},
		
		/*
		Compiles a template into an equivalent JS function for faster
		repeated execution. 
		*/
		compile: function(template, partials) {
			if (!template) { return function() { return '' }; }
			
			var p = {};
			if (partials) {
				for (var key in partials) {
					if (partials.hasOwnProperty(key)) {
						p[key] = partials[key];
					}
				}
			}
			
			var commands = [];
			var s = function(command) { commands.push(command); };
			
			(new Renderer(s)).render(template, p);

			return function(view, send_func) {
				view = [view || {}];
				
				var o = send_func ? undefined : [];
				var s = send_func || function(output) { o.push(output); };	
			
				for (var i=0,n=commands.length; i<n; ++i) {
					commands[i](view, s);
				}
				
				if (!send_func) {
					return o.join('');
				}
			};
		}
	});
}();
