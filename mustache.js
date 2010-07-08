/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = function() {
	var ParserException = function(message) { 
		this.message = message;
	}
	
	var Renderer = function(send_func) {
		this.send_func = send_func;
		
		this.pragmas = {};
	};
	Renderer.prototype = {
		render: function(template, context, partials) {
			template = this.parse_pragmas(template, '{{', '}}');
			
			var tokens = this.tokenize(template, '{{', '}}');
			
			this.parse(this.createParserContext(tokens, partials, '{{', '}}'), [context]);
		},
		
		createParserContext: function(tokens, partials, openTag, closeTag) {
			return {
				tokens: tokens,
				index: 0,
				length: tokens.length,
				partials: partials,
				stack: [],
				openTag: openTag,
				closeTag: closeTag,
			};
		},
		
		tokenize: function(template, openTag, closeTag) {
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
			
			var regex = new RegExp('(' + delimiters.join('|') + ')');
			
			var tokens = template.split(regex);
			var cleaned_tokens = [];
			for (var i = 0, n = tokens.length; i<n; ++i) {
				if (tokens[i]!=='') {
					cleaned_tokens.push(tokens[i]);
				}
			}
			
			return cleaned_tokens;
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

				return ""; // blank out all ragmas
			});
		},
	
		
		parse: function(parserContext, contextStack) {
			var state = 'text';
			
			for (; parserContext.index<parserContext.length; ++parserContext.index) {
				state = this.stateMachine[state].call(this, parserContext, contextStack);
			}
			
			// make sure the parser finished at an appropriate terminal state
			if (state!=='text') {
				this.stateMachine['endOfDoc'].call(this, parserContext, contextStack);
			}
		},
		
		escape_regex: function(text) {
			// thank you Simon Willison
			var specials = [
				'/', '.', '*', '+', '?', '|',
				'(', ')', '[', ']', '{', '}', '\\'
			];
			var compiled_regex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
			
			return text.replace(compiled_regex, '\\$1');
		},
	
		isWhitespace: function(token) {
			return token.match(/^\s+$/)!==null;
		},
		
		stateMachine: {
			text: function(parserContext, contextStack) {
				switch (parserContext.tokens[parserContext.index]) {
					case parserContext.openTag:
						return 'openMustache';
					default:
						this.send_func(parserContext.tokens[parserContext.index]);
						
						return 'text';
				}
			},
			openMustache: function(parserContext, contextStack) {
				switch (parserContext.tokens[parserContext.index]) {
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

						return this.stateMachine.keyName.call(this, parserContext, contextStack);
				}
			},
			closeMustache: function(parserContext, contextStack) {
				if (this.isWhitespace(parserContext.tokens[parserContext.index])) {
					return 'closeMustache';
				} else if (parserContext.tokens[parserContext.index]===parserContext.closeTag) {
					return this.dispatchCommand(parserContext, contextStack);
				}
			},
			expectClosingMustache: function(parserContext, contextStack) {
				if (parserContext.closeTag==='}}' && 
					parserContext.tokens[parserContext.index]==='}}') {
					return 'expectClosingParenthesis';
				} else if (parserContext.tokens[parserContext.index]==='}') {
					return 'closeMustache';
				} else {
					throw new ParserException('Unexpected token encountered.');
				}
			},
			expectClosingParenthesis: function(parserContext, contextStack) {
				if (parserContext.tokens[parserContext.index]==='}') {
					return this.dispatchCommand(parserContext, contextStack);
				} else {
					throw new ParserException('Unexpected token encountered.');
				}
			},
			keyName: function(parserContext, contextStack) {
				var result = this.stateMachine.simpleKeyName.call(this, parserContext, contextStack);
				
				if (result==='closeMustache') {
					var tagKey = parserContext.stack.pop();
					var tag = parserContext.stack.pop();
					
					if (tag.tagType==='unescapedVariable' && tag.subtype==='tripleMustache') {
						parserContext.stack.push({tagType:'unescapedVariable'});
						parserContext.stack.push(tagKey);
						
						return 'expectClosingMustache';
					} else {
						parserContext.stack.push(tag);
						parserContext.stack.push(tagKey);
						
						return 'closeMustache';
					}
				} else if (result==='simpleKeyName') {
					return 'keyName';
				} else {
					throw new ParserException('Unexpected branch in tag name: ' + result);
				}
			},
			simpleKeyName: function(parserContext, contextStack) {
				if (this.isWhitespace(parserContext.tokens[parserContext.index])) {
					return 'simpleKeyName';
				} else {
					parserContext.stack.push(parserContext.tokens[parserContext.index]);
					
					return 'closeMustache';
				}
			},
			
			setDelimiterStart: function(parserContext, contextStack) {
				if (this.isWhitespace(parserContext.tokens[parserContext.index]) ||
					parserContext.tokens[parserContext.index]==='=') {
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack.push(parserContext.tokens[parserContext.index]);
					return 'setDelimiterStartOrWhitespace';
				}				
			},
			setDelimiterStartOrWhitespace: function(parserContext, contextStack) {
				if (this.isWhitespace(parserContext.tokens[parserContext.index])) {
					return 'setDelimiterEnd';
				} else if (parserContext.tokens[parserContext.index]==='='){
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack.push(parserContext.stack.pop() + parserContext.tokens[parserContext.index]);
					
					return 'setDelimiterStartOrWhitespace';
				}
			},
			setDelimiterEnd: function(parserContext, contextStack) {
				if (this.isWhitespace(parserContext.tokens[parserContext.index])) {
					return 'setDelimiterEnd';
				} else if (parserContext.tokens[parserContext.index]==='=') {
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack.push(parserContext.tokens[parserContext.index]);
				
					return 'setDelimiterEndOrEqualSign';
				}
			},
			setDelimiterEndOrEqualSign: function(parserContext, contextStack) {
				if (parserContext.tokens[parserContext.index]==='=') {
					return 'setDelimiterExpectClosingTag';
				} else if (this.isWhitespace(parserContext.tokens[parserContext.index])) {
					throw new ParserException('Syntax error in Set Delimiter tag');
				} else {
					parserContext.stack.push(parserContext.stack.pop() + parserContext.tokens[parserContext.index]);
					
					return 'setDelimiterEndOrEqualSign';
				}
			},
			setDelimiterExpectClosingTag: function(parserContext, contextStack) {
				if (parserContext.tokens[parserContext.index]===parserContext.closeTag) {
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
			
			endSectionScan: function(parserContext, contextStack) {
				switch (parserContext.tokens[parserContext.index]) {
					case parserContext.openTag:
						return 'expectSectionOrEndSection';
					default:
						parserContext.stack[parserContext.stack.length-1].content.push(parserContext.tokens[parserContext.index]);
						return 'endSectionScan';
				}
			},
			expectSectionOrEndSection: function(parserContext, contextStack) {
				switch (parserContext.tokens[parserContext.index]) {
					case '#':
					case '^':
						parserContext.stack[parserContext.stack.length-1].depth++;
						parserContext.stack[parserContext.stack.length-1].content.push(parserContext.openTag + parserContext.tokens[parserContext.index]);						
						return 'endSectionScan';
					case '/':
						parserContext.stack.push({tagType:'endSection'});
						return 'simpleKeyName';
					default:
						parserContext.stack[parserContext.stack.length-1].content.push(parserContext.openTag + parserContext.tokens[parserContext.index]);
						return 'endSectionScan';
				}
			},
			
			discard: function(parserContext, contextStack) {
				if (parserContext.tokens[parserContext.index]===parserContext.closeTag) {
					return 'text';
				} else {
					return 'discard';
				}
			},
			
			endOfDoc: function(parserContext, contextStack) {
				// eventually we may want to give better error messages
				throw new ParserException('Unexpected end of document.');
			}
		},

		dispatchCommand: function(parserContext, contextStack) {			
			var key = parserContext.stack.pop();
			var command = parserContext.stack.pop();
			
			switch (command.tagType) {
				case 'section':
					parserContext.stack.push({sectionType:'section', key:key, content:[], depth:1});
					return 'endSectionScan';
				case 'invertedSection':
					parserContext.stack.push({sectionType:'invertedSection', key:key, content:[], depth:1});
					return 'endSectionScan';
				case 'variable':
					this.render_variable(key, contextStack);
					return 'text';
				case 'unescapedVariable':
					this.render_unescaped_variable(key, contextStack);
					return 'text';
				case 'partial':
					this.render_partial(key,
						contextStack,
						parserContext.partials,
						parserContext.openTag,
						parserContext.closeTag);
						
					return 'text';
				case 'endSection':
					var section = parserContext.stack.pop();
					if (--section.depth === 0) {
						if (section.key === key) {
							this.render_section(section.sectionType,
								section.content.join(''),
								key,
								contextStack,
								parserContext.partials,
								parserContext.openTag,
								parserContext.closeTag);
								
							return 'text';
						} else {
							throw new ParserException('Unbalanced open/close section tags');
						}
					} else {
						section.content.push('{{/' + key + '}}');
						
						parserContext.stack.push(section);
						
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
		
		render_variable: function(key, contextStack) {
			function escapeHTML(str) {
				return ('' + str).replace(/&/g,'&amp;')
					.replace(/</g,'&lt;')
					.replace(/>/g,'&gt;');
			}

			var result = this.find_in_stack(key, contextStack);
			if (result!==undefined) {
				this.send_func(escapeHTML(result));
			}
		},
		render_unescaped_variable: function(key, contextStack) {
			var result = this.find_in_stack(key, contextStack);
			if (result!==undefined) {
				this.send_func(result);
			}
		},
		render_partial: function(key, contextStack, partials, openTag, closeTag) {
			if (!partials || partials[key] === undefined) {
				throw new ParserException('Unknown partial \'' + key + '\'');
			}
			
			var res = this.find_in_stack(key, contextStack);
			if (this.is_object(res)) {
				contextStack.push(res);
			}
			
			var tokens = this.tokenize(partials[key], openTag, closeTag);

			this.parse(this.createParserContext(tokens, partials, openTag, closeTag), contextStack);
			
			if (this.is_object(res)) {
				contextStack.pop();
			}
		},
		render_section: function(sectionType, mustacheFragment, key, contextStack, partials, openTag, closeTag) {
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
		
			var value = this.find_in_stack(key, contextStack);

			var tokens;
			if (sectionType==='invertedSection') {
				if (!value || this.is_array(value) && value.length === 0) {
					// false or empty list, render it
					tokens = this.tokenize(mustacheFragment, openTag, closeTag);
			
					this.parse(this.createParserContext(tokens, partials, openTag, closeTag), contextStack);
				}
			} else if (sectionType==='section') {
				if (this.is_array(value)) { // Enumerable, Let's loop!
					tokens = this.tokenize(mustacheFragment, openTag, closeTag);
					
					for (var i=0, n=value.length; i<n; ++i) {
						contextStack.push(create_context(value[i]));
						this.parse(this.createParserContext(tokens, partials, openTag, closeTag), contextStack);
						contextStack.pop();
					}
				} else if (this.is_object(value)) { // Object, Use it as subcontext!
					tokens = this.tokenize(mustacheFragment, openTag, closeTag);
					contextStack.push(value);
					this.parse(this.createParserContext(tokens, partials, openTag, closeTag), contextStack);
					contextStack.pop();
				} else if (this.is_function(value)) {
					// higher order section
					var that = this;
					
					var result = value.call(contextStack[contextStack.length-1], mustacheFragment, function(resultFragment) {
						var tempStream = [];
						var old_send_func = that.send_func;
						that.send_func = function(text) { tempStream.push(text); };
						
						tokens = that.tokenize(resultFragment, openTag, closeTag);						
						that.parse(that.createParserContext(tokens, partials, openTag, closeTag), contextStack);
						
						that.send_func = old_send_func;
						
						return tempStream.join('');
					});
					
					this.send_func(result);
				} else if (value) { // boolean section
					tokens = this.tokenize(mustacheFragment, openTag, closeTag);
					this.parse(this.createParserContext(tokens, partials, openTag, closeTag), contextStack);
				}			
			} else {
				throw new ParserException('Unknown section type ' + sectionType);
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
			var o = [];
			var s = send_func || function(output) { o.push(output); };
			
			var renderer = new Renderer(s);
			renderer.render(template, view, partials);
			
			if (!send_func) {
				return o.join('');
			}
		}
	});
}();
