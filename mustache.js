/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.

  interface:
    Mustache.to_html(template, context, partials, send_fun)
    Mustache.template(name, template, options)
    Mustache.tmpl(name, context)
    Mustache.set_pragma_default(name, pragma_default, pragma) 
    
 */

(function() {
  function Renderer(options,name) {
    this.name = name; //helps with partial recursion
    var p_source = this.default_pragmas;
    if (options) {
      if (options.pragmas) p_source = options.pragmas;
      if (options.sub) this.sub = true;
    }
    this.pragmas = {};
    for (p in p_source) {
      this.pragmas[p] = p_source[p];
      this.pragma_initialize(p);
    }
  }
  function PublicMustache(){}
  /* 
    Public Interface
  */
  PublicMustache.prototype = {
    name: "mustache.js",
    version: "0.4-dev",
    Renderer:Renderer,
    to_html:function(template, context, partials, send_fun) {
      var compiled = new this.Renderer().compile(template, partials);
      if (typeof send_fun==='function') ///hack for now until we implement buffer?
        send_fun(compiled.render(context));
      else
        return compiled.render(context);
    },
    template:function(name,template,options) {
      var tmpl = this.Renderer.prototype.partials[name] = new this.Renderer(options,name);
      return tmpl.compile(template,false); //separate step for recursive partials
    },
    tmpl:function(name,context) {
      if (name in this.Renderer.prototype.partials) {
        return this.Renderer.prototype.partials[name].render(context);
      } else {
        throw Error('No template or partial with name:'+name);
      }
    },
    ///Run this before creating templates depending on them
    set_pragma_default:function(name, pragma_default, pragma) {
      if (pragma_default) {
        this.Renderer.prototype.default_pragmas[name] = (typeof pragma_default=='object'?pragma_default:{});
      } else {
        delete this.Renderer.prototype.default_pragmas[name];
      }
      if (pragma)
        this.Renderer.prototype.pragmas_implemented[name] = pragma;
    }
  }

  if (this.Mustache) 
    this.SkyMustache = new PublicMustache();
  else
    this.Mustache = new PublicMustache();
  
  /* 
     Checks whether a value is thruthy or false or 0
     Optimization: taking this out of find() speeds it up
  */
  function is_kinda_truthy(bool) {
    return bool === false || bool === 0 || bool;
  }
    
  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",

    //stateful objects--can we separate these out somehow?
    state: {},
    context: {},
    recurse: 0,
    partials: {}, //set only on the prototype--so this is a Singleton
    default_pragmas: {
      'IMPLICIT-ITERATOR':{iterator:'.'}
    },
    pragmas_implemented: {
      ///return overrides run during template parsing in this.piece()
      'IMPLICIT-ITERATOR':function() {
        return function(method,name,pragma_opts) {
          if (name !== pragma_opts.iterator) return false;
          switch(method) {
            case "^":case "#":
              return false
            case "{": //unescaped content
              return this.pieces.dot_unescaped;
            default:
              return this.pieces.dot_escaped;
          }
        }
      },
      '?-CONDITIONAL':function() {
        return function(method,name,pragma_opts,obj) {
          if (method === '#' && /\?$/.test(name)) {
            obj.base_name = name.substr(0,name.length-1);
            return this.pieces.conditional;
          }
        }
      },
      'DOT-SEPARATORS':function() {
        this.get_object = function(name,context) {
          var parts = name.split("."), obj = context;
          for(var i = 0, p; obj && (p = parts[i]); i++){
            obj = (p in obj ? obj[p] : undefined);
          }
          return obj;
        }
      }
    },
    pragma_initialize: function(name) {
      if (typeof this.pragmas_implemented[name] === 'function') {
        this.pragmas[name]['=override'] = this.pragmas_implemented[name].call(this);
      } else {
	throw Error("This implementation of mustache doesn't understand the '"+name+"' pragma");
      }
    },
    pragma_parse: function(pragma_declaration) {
      var pragma = {};
      var name_opts = pragma_declaration.split(/\s+/);
      if (name_opts.length > 1) {
        var opts = name_opts[1].split('=');
        if (opts.length > 1) {
          pragma[opts[0]] = opts[1];
        }
      }
      this.pragmas[name_opts[0]] = pragma;
      this.pragma_initialize(name_opts[0]);
    },

    render: function(state, top_context) {
      this.state = {ctx:[],contexts:[state]};
      this.context = top_context || state;
      return this.map(this.compiled, this.render_func, this).join('');
    },

    render_func: function(o) {
      return (typeof o === 'string' ? o : o.content.call(this,o,this.state));
    },

    compile: function(template, partials, opts) {
      var compiled = [];
      //1. TODO find pragmas and replace them
      var otag = (opts && opts.otag ? opts.otag : this.otag);
      var ctag = (opts && opts.ctag ? opts.ctag : this.ctag);
      if (partials) {
        for (a in partials) {
          if (! (a in Renderer.prototype.partials)) {
            var p = Renderer.prototype.partials[a] = new Renderer(false,a);
            p.compile(partials[a],false); //separate step for recursive partials
          }
        }
      }
      
      //2. split on new delimiters
      var sections = this.split_delimiters(template, otag, ctag)
      .map(function(s_delim) {
        return this.split_sections(s_delim.template, s_delim.otag, s_delim.ctag);
      },this);
      
      for (var i=0;i<sections.length;i++) {
        for (var j=0;j<sections[i].length;j++) {
          var s = sections[i][j];
          if (s.name === undefined) {
            //3. for each delimiter break up tags/blocks
            this.split_tags(s.template, s.otag, s.ctag, compiled);
          } else {
            compiled.push(s)
          }
        }
      }

      var last = compiled.length -1;
      if (typeof compiled[last] === 'string') {
        compiled[last] = compiled[last].replace(/\n+$/,'');
      }
      this.template = template;
      this.compiled = compiled;
      return this;
    },

    to_html: function(template, context, partials) {
      ///alters state!  should it!?
      var compiled = this.compile(template, partials);
      return compiled.render(context);
    },

    /* breaks up the template by delimiters
       this helps avoid some other random bugs, but
       an edge-case consequence is that you cannot change delimiters inside blocks
     */
    split_delimiters: function(template, otag, ctag) {
      var regex = new RegExp("\\n?" + otag+'=([^=\\s]+)\\s+([^=\\s]+)='+ctag,'g');
      var pragma_regex = new RegExp(otag + "%\\s*([^\\/#\\^]+?)\\s*%?" + ctag, "g");
      var found = regex.exec(template);
      var rv_list = [];

      var that = this;
      function remove_pragmas(tmpl) {
        return tmpl.replace(pragma_regex,function(full_match, pragma_declaration) {
          that.pragma_parse.call(that,pragma_declaration);
          return '';
        });
      }

      if (found) {
        rv_list.push({
          'template': remove_pragmas(template.slice(0,regex.lastIndex-found[0].length)),
          'otag':otag,'ctag':ctag
        });
        Array.prototype.push.apply(rv_list, this.split_delimiters(
          template.slice(regex.lastIndex),
          this.escape_regex(found[1]),this.escape_regex(found[2])
        ))
      } else {
        rv_list.push({'template':remove_pragmas(template),'otag':otag,'ctag':ctag});
      }
      return rv_list;
    },


    /*
      Divides inverted (^) and normal (#) sections
    */
    split_sections: function(template, otag, ctag) {
      // CSW - Added "+?" so it finds the tighest bound, not the widest
      var regex = new RegExp("(^|\\n*)" + otag + "(\\^|\\#)\\s*(.*[^\\s])\\s*" + ctag +
                             "(\\n*)([\\s\\S]+?)" + otag + "\\/\\s*\\3\\s*" + ctag +
                             "(\\s*)", "mg");
      var found, prevInd=0, rv_list = [];
      while (found = regex.exec(template)) {
        rv_list.push({
          'template':template.slice(prevInd,regex.lastIndex-found[0].length),
          'otag':otag,'ctag':ctag
        })
        ///stupid white space rules (still don't work)
        var temp = (((found[1] && found[4])? '\n' : '') 
                    + found[5]
                    +((found[6] && found[4])? '\n' : '') );

        var sub_section = {
          'block':found[2],       //'#'=test/list '^'=inverted
          'name':found[3],        //block name value
          'uncompiled': temp, //inner block content
          'compiled':new Renderer({pragmas:this.pragmas,sub:true},this.name).compile(temp,null,{'otag':otag,'ctag':ctag}),
          'otag':otag,'ctag':ctag
        }
        sub_section['content'] = this.piece(found[2], found[3], sub_section),
        rv_list.push(sub_section);

        prevInd = regex.lastIndex;
      }
      rv_list.push({
        'template':template.slice(prevInd),
        'otag':otag,'ctag':ctag
      });
      return rv_list;
    },
    /* 
       Split regular strings with {{foo}} and friends into array of joinable parts
     */
    split_tags: function(template, otag, ctag, rv_list) {
      var regex = new RegExp(otag + "(=|!|>|\\{|%)?\\s*([^\\/#\\^]+?)\\s*(\\1|\\})?" + ctag, "g");
      var found, prevInd=0;
      while (found = regex.exec(template)) {
        var front = regex.lastIndex-found[0].length;
        if (front != prevInd) //don't push empty strings
          rv_list.push(/*string content:*/
            template.slice(prevInd,regex.lastIndex-found[0].length)
          );
        var sub_section = {'name':found[2]};
        switch(found[1]) {//operator
        case "!": 
          break; // ignore comments
        case "%": 
          //shouldn't get here, because this is done in the split_delimiters phase
          //so pragmas will be enabled in time for different section blocks to be passed 
          //to compiled sub-sections
          this.pragma_parse(found[2]);
          break;
        case "{": // the triple mustache is unescaped
          sub_section['content'] = this.piece('{',found[2],sub_section);
          rv_list.push(sub_section);
          break;
        case ">": // partials
          if (found[2] in this.partials) {
	    sub_section['compiled'] = this.partials[found[2]];
            //rv_list.push.apply(rv_list, this.partials[found[2]].compiled);
          } else if (found[2] === this.name) {///recursion
            throw Error("Unset partial reference '"+found[2]+"' not found in template:"+ this.name);
            //sub_section['compiled'] = this; //issue: might be child of partial like in a block
          } else {
            throw Error("Partial reference '"+found[2]+"' not found in template:"+ this.name);
          }
          //sub_section['compiled'].compiled.push('\n');
          //break;
        default: // regular escaped value
          sub_section['content'] = this.piece(found[1],found[2],sub_section);
          rv_list.push(sub_section);
          break;
        }
        prevInd = regex.lastIndex;
      }
      if (prevInd != template.length) //TODO: should this be length-1?
        rv_list.push(/*string content:*/template.slice(prevInd));
      return rv_list;
    },
    pieces: {
      inverse_block:function(ctx, state) {
        var value = this.find(ctx.name, state.contexts[0]);
        if (!value || this.is_array(value) && value.length === 0) {
          return ctx.compiled.render(state.contexts[0], state.contexts[0]);
        } else
          return ""
      },
      conditional:function(ctx, state) {
        var value = this.find(ctx.base_name, state.contexts[0]);
        if (value) {
          return ctx.compiled.render(state.contexts[0], this.context);
        }
      },
      partial:function(ctx, state) {
	var c = state.contexts[0];
        ++this.recurse;
        if (this.recurse > 100 && this === ctx.compiled) {
          var keys = '';
          for (a in c) { keys += " ,"+a; }
          throw Error("TOO MUCH RECURSION:" + keys);
        }
	return ctx.compiled.render((typeof c[ctx.name]==='object' ? c[ctx.name] : c), this.context);
      },
      block:function(ctx, state) {
        var value = this.find(ctx.name, state.contexts[0]);
        if (value) {
          if(Object.prototype.toString.call(value)==='[object Array]'){// Enumerable, Let's loop!
            state.ctx.unshift(ctx);
            state.contexts.unshift(0);
            var rv = this.map(value, function render_array_item(row) {
              this.state.contexts[0] = row;
              return this.map(this.state.ctx[0].compiled.compiled,
                              this.render_func,this).join('');
            },this).join("");
            state.contexts.shift();
            state.ctx.shift();
            return rv;
          } 
	  switch (typeof value) {
	  case 'function':
            return value.call(state.contexts[0], ctx.uncompiled, function render(text) {
              if (text === ctx.uncompiled) {
                return ctx.compiled.render(state.contexts[0], state.contexts[state.contexts.length-1]);
              } else {
                return new Renderer({sub:true},this.name).compile(text).render(state.contexts[0], 
                                                           state.contexts[state.contexts.length-1]);
              }
            });
	  case 'object':
            //state.ctx = ctx;
            var rv = ctx.compiled.render(value, this.context);
            return rv;
	  default:
            return ctx.compiled.render(state.contexts[0], this.context);	    
          }
        } 
        return "";
      },
      escaped:function(ctx, state) {
        return this.escape(this.find(ctx.name, state.contexts[0]));
      },
      unescaped:function(ctx, state) {
        return this.find(ctx.name, state.contexts[0]);
      },
      dot_escaped:function(ctx,state) {
        return this.escape(this.display(state.contexts[0],state.contexts[0]));
      },
      dot_unescaped:function(ctx,state) {
        return this.display(state.contexts[0],state.contexts[0]);
      }
    },
    piece: function(method, name, obj) {
      for (a in this.pragmas) {
        var p = this.pragmas[a];
        if (p['=override']) {
          var handler = p['=override'].call(this,method,name,p,obj);
          if (handler) return handler;
        }
      }
      switch(method) {
      case "^"://invert
        return this.pieces.inverse_block;
      case "#"://block
        return this.pieces.block;
      case ">"://partial
        return this.pieces.partial;
      case "{": //unescaped content
        return this.pieces.unescaped;
      default:
        return this.pieces.escaped;
      }
    },
    escape_regex: function(text) {
      var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
      ];
      var regex = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
      );
      return text.replace(regex,'\\$1');
    },
    
    get_object: function(name,ctx) {
      return ctx[name];
    },
    display: function(value,context) {
      if(typeof value === "function") {
        return value.apply(context);
      }
      if(value !== undefined) {
        return value;
      }
      // silently ignore unkown variables
      return "";
    },
    find: function(name, context) {
      var value = this.get_object(name,context);
      if (is_kinda_truthy(value)
          ||
          is_kinda_truthy(value = this.get_object(name,this.context))
         ) {
        return this.display(value,context);
      } 
      return ""
    },

    /*
      Does away with nasty characters
    */
    escape: function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|[\"\'<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";
        case '"': return '&quot;';
        case "'": return '&#39;';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
      ///Why do we need to escape these characters?
      //case "\\": return "\\\\";
      //case ">": return "&gt;";
    },

    is_array: function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function(ary, fn, thisObj) {
      if (typeof ary.map==='function') 
        return ary.map(fn,thisObj);
      else {
        var len = ary.length >>> 0,
          rv = new Array(len);
        for (var i=0;i<len;i++) {
          rv[i] = fn.call(thisObj, ary[i]);
        }
        return rv;
      }
    }

  }/*Renderer.prototype*/

  
})()