/*!
 * Benchmark.js
 * Copyright 2010-2011 Mathias Bynens <http://mths.be/>
 * Based on JSLitmus.js, copyright Robert Kieffer <http://broofa.com/>
 * Modified by John-David Dalton <http://allyoucanleet.com/>
 * Available under MIT license <http://mths.be/mit>
 */
(function(window) {

  /** Detect DOM0 timeout API (performed at the bottom) */
  var HAS_TIMEOUT_API,

  /** Detect Adobe AIR environment */
  IN_AIR = isClassOf(window.runtime, 'ScriptBridgingProxyObject'),

  /** Detect Java environment */
  IN_JAVA = isClassOf(window.java, 'JavaPackage'),

  /** Used to integrity check compiled tests */
  EMBEDDED_UID = +new Date,

  /** Used to skip initialization of the Benchmark constructor */
  HEADLESS = function() { },

  /** Used to avoid hz of Infinity */
  CYCLE_DIVISORS = {
    '1': 4096,
    '2': 512,
    '3': 64,
    '4': 8,
    '5': 0
  },

  /**
   * T-Distribution two-tailed critical values for 95% confidence
   * http://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm
   */
  T_DISTRIBUTION = {
    '1':  12.706,'2':  4.303, '3':  3.182, '4':  2.776, '5':  2.571, '6':  2.447,
    '7':  2.365, '8':  2.306, '9':  2.262, '10': 2.228, '11': 2.201, '12': 2.179,
    '13': 2.160, '14': 2.145, '15': 2.131, '16': 2.120, '17': 2.110, '18': 2.101,
    '19': 2.093, '20': 2.086, '21': 2.080, '22': 2.074, '23': 2.069, '24': 2.064,
    '25': 2.060, '26': 2.056, '27': 2.052, '28': 2.048, '29': 2.045, '30': 2.042,
    'Infinity': 1.960
  },

  /** Internal cached used by various methods */
  cache = {
    'counter': 0
  },

  /** Used in Benchmark.hasKey() */
  hasOwnProperty = cache.hasOwnProperty,

  /** Used to convert array-like objects to arrays */
  slice = [].slice,

  /** Used generically when invoking over queued arrays */
  shift = aloClean([].shift),

  /** Math shortcuts */
  abs  = Math.abs,
  max  = Math.max,
  min  = Math.min,
  pow  = Math.pow,
  sqrt = Math.sqrt;

  /*--------------------------------------------------------------------------*/

  /**
   * Benchmark constructor.
   * @constructor
   * @param {String} name A name to identify the benchmark.
   * @param {Function} fn The test to benchmark.
   * @param {Object} [options={}] Options object.
   * @example
   *
   * // basic usage
   * var bench = new Benchmark(fn);
   *
   * // or using a name first
   * var bench = new Benchmark('foo', fn);
   *
   * // or with options
   * var bench = new Benchmark('foo', fn, {
   *
   *   // displayed by Benchmark#toString if `name` is not available
   *   'id': 'xyz',
   *
   *   // called when the benchmark starts running
   *   'onStart': onStart,
   *
   *   // called after each run cycle
   *   'onCycle': onCycle,
   *
   *   // called when aborted
   *   'onAbort': onAbort,
   *
   *   // called when a test errors
   *   'onError': onError,
   *
   *   // called when reset
   *   'onReset': onReset,
   *
   *   // called when the benchmark completes running
   *   'onComplete': onComplete,
   *
   *   // compiled/called before the test loop
   *   'setup': setup,
   *
   *   // compiled/called after the test loop
   *   'teardown': teardown
   * });
   *
   * // or options only
   * var bench = new Benchmark({
   *
   *   // benchmark name
   *   'name': 'foo',
   *
   *   // benchmark test function
   *   'fn': fn
   * });
   *
   * // a test's `this` binding is set to the benchmark instance
   * var bench = new Benchmark('foo', function() {
   *   'My name is '.concat(this.name); // My name is foo
   * });
   */
  function Benchmark(name, fn, options) {
    // juggle arguments
    var me = this;
    if (isClassOf(name, 'Object')) {
      // 1 argument
      options = name;
    }
    else if (isClassOf(name, 'Function')) {
      // 2 arguments
      options = fn;
      fn = name;
    }
    else {
      // 3 arguments
      me.name = name;
    }
    // initialize if not headless
    if (name != HEADLESS) {
      setOptions(me, options);
      fn = me.fn || (me.fn = fn);
      fn.uid || (fn.uid = ++cache.counter);

      me.created = +new Date;
      me.stats = extend({ }, me.stats);
      me.times = extend({ }, me.times);
    }
  }

  /**
   * Suite constructor.
   * @constructor
   * @member Benchmark
   * @param {String} name A name to identify the suite.
   * @param {Object} [options={}] Options object.
   * @example
   *
   * // basic usage
   * var suite = new Benchmark.Suite;
   *
   * // or using a name first
   * var suite = new Benchmark.Suite('foo');
   *
   * // or with options
   * var suite = new Benchmark.Suite('foo', {
   *
   *   // called when the suite starts running
   *   'onStart': onStart,
   *
   *   // called between running benchmarks
   *   'onCycle': onCycle,
   *
   *   // called when aborted
   *   'onAbort': onAbort,
   *
   *   // called when a test errors
   *   'onError': onError,
   *
   *   // called when reset
   *   'onReset': onReset,
   *
   *   // called when the suite completes running
   *   'onComplete': onComplete
   * });
   */
  function Suite(name, options) {
    // juggle arguments
    var me = this;
    if (isClassOf(name, 'Object')) {
      options = name;
    } else {
      me.name = name;
    }
    setOptions(me, options);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Wraps an array function to ensure array-like-objects (ALO) are empty when their length is `0`.
   * @private
   * @param {Function} fn The array function to be wrapped.
   * @returns {Function} The new function.
   */
  function aloClean(fn) {
    return function() {
      var me = this,
          result = fn.apply(me, arguments);
      // fixes IE<9 and IE8 compatibility mode bugs
      if (!me.length) {
        delete me[0];
      }
      return result;
    };
  }

  /**
   * Executes a function asynchronously or synchronously.
   * @private
   * @param {Object} me The benchmark instance passed to `fn`.
   * @param {Function} fn Function to be executed.
   * @param {Boolean} [async=false] Flag to run asynchronously.
   */
  function call(me, fn, async) {
    // only attempt asynchronous calls if supported
    if (async && HAS_TIMEOUT_API) {
      me.timerId = setTimeout(function() {
        delete me.timerId;
        fn();
      }, me.CYCLE_DELAY * 1e3);
    }
    else {
      fn();
    }
  }

  /**
   * Clocks the time taken to execute a test per cycle (secs).
   * @private
   * @param {Object} me The benchmark instance.
   * @returns {Number} The time taken.
   */
  function clock() {
    var applet,
        args,
        fallback,
        proto = Benchmark.prototype,
        timers = [],
        timerNS = Date,
        msRes = getRes('ms'),
        timer = { 'ns': timerNS, 'res': max(0.0015, msRes), 'unit': 'ms' },
        code = 'var r$,s$,m$=this,i$=m$.count,f$=m$.fn;#{setup}#{start};while(i$--){|}#{end};#{teardown}return{time:r$,uid:"$"}|m$.teardown&&m$.teardown();|f$()|m$.setup&&m$.setup();|n$';

    clock = function(me) {
      var result,
          fn = me.fn,
          compiled = fn.compiled,
          count = me.count;

      if (applet) {
        // repair nanosecond timer
        try {
          timerNS.nanoTime();
        } catch(e) {
          // use non-element to avoid issues with libs that augment them
          timerNS = new applet.Packages.nano;
        }
      }
      if (compiled == null || compiled) {
        try {
          if (!compiled) {
            // insert test body into the while-loop
            compiled = createFunction(args,
              interpolate(code[0], { 'setup': getSource(me.setup) }) +
              getSource(fn) +
              interpolate(code[1], { 'teardown': getSource(me.teardown) })
            );
            // determine if compiled code is exited early, usually by a rogue
            // return statement, by checking for a return object with the uid
            me.count = 1;
            compiled = fn.compiled = compiled.call(me, timerNS).uid == EMBEDDED_UID && compiled;
            me.count = count;
          }
          if (compiled) {
            result = compiled.call(me, timerNS).time;
          }
        } catch(e) {
          me.count = count;
          compiled = fn.compiled = false;
        }
      }
      // fallback to simple while-loop when compiled is false
      if (!compiled) {
        result = fallback.call(me, timerNS).time;
      }
      return result;
    };

    function getRes(unit) {
      var measured,
          start,
          count = 30,
          divisor = 1e3,
          sample = [];

      // get average smallest measurable time
      while (count--) {
        if (unit == 'us') {
          divisor = 1e6;
          if (timerNS.stop) {
            timerNS.start();
            while(!(measured = timerNS.microseconds()));
          } else {
            start = timerNS();
            while(!(measured = timerNS() - start));
          }
        }
        else if (unit == 'ns') {
          divisor = 1e9;
          start = timerNS.nanoTime();
          while(!(measured = timerNS.nanoTime() - start));
        }
        else {
          start = new timerNS;
          while(!(measured = new timerNS - start));
        }
        // check for broken timers (nanoTime may have issues)
        // http://alivebutsleepy.srnet.cz/unreliable-system-nanotime/
        if (measured > 0) {
          sample.push(measured);
        } else {
          sample.push(Infinity);
          break;
        }
      }
      // convert to seconds
      return getMean(sample) / divisor;
    }

    // detect nanosecond support from a Java applet
    each(window.document && document.applets || [], function(element) {
      if (timerNS = applet = 'nanoTime' in element && element) {
        return false;
      }
    });

    // or the exposed Java API
    // http://download.oracle.com/javase/6/docs/api/java/lang/System.html#nanoTime()
    try {
      timerNS = java.lang.System;
    } catch(e) { }

    // check type in case Safari returns an object instead of a number
    try {
      if (typeof timerNS.nanoTime() == 'number') {
        timers.push({ 'ns': timerNS, 'res': getRes('ns'), 'unit': 'ns' });
      }
    } catch(e) { }

    // detect Chrome's microsecond timer:
    // enable benchmarking via the --enable-benchmarking command
    // line switch in at least Chrome 7 to use chrome.Interval
    try {
      if (timerNS = new (window.chrome || window.chromium).Interval) {
        timers.push({ 'ns': timerNS, 'res': getRes('us'), 'unit': 'us' });
      }
    } catch(e) { }

    // detect Node's microtime module:
    // npm install microtime
    try {
      if (timerNS = typeof require == 'function' && !window.require && require('microtime').now) {
        timers.push({ 'ns': timerNS, 'res': getRes('us'), 'unit': 'us' });
      }
    } catch(e) { }

    // pick timer with highest resolution
    timerNS = (timer = reduce(timers, function(timer, other) {
      return other.res < timer.res ? other : timer;
    }, timer)).ns;

    // restore ms res
    if (timer.unit == 'ms') {
      timer.res = msRes;
    }
    // remove unused applet
    if (timer.unit != 'ns' && applet) {
      applet.parentNode.removeChild(applet);
      applet = null;
    }
    // error if there are no working timers
    if (timer.res == Infinity) {
      throw new Error('Benchmark.js was unable to find a working timer.');
    }
    // use API of chosen timer
    if (timer.unit == 'ns') {
      code = interpolate(code, {
        'start': 's$=n$.nanoTime()',
        'end': 'r$=(n$.nanoTime()-s$)/1e9'
      });
    }
    else if (timer.unit == 'us') {
      code = interpolate(code, timerNS.stop ? {
        'start': 's$=n$.start()',
        'end': 'r$=n$.microseconds()/1e6'
      } : {
        'start': 's$=n$()',
        'end': 'r$=(n$()-s$)/1e6'
      });
    }
    else {
      code = interpolate(code, {
        'start': 's$=new n$',
        'end': 'r$=(new n$-s$)/1e3'
      });
    }

    // inject uid into variable names to avoid collisions with
    // embedded tests and create non-embedding fallback
    code = code.replace(/\$/g, EMBEDDED_UID).split('|');
    args = code.pop();
    fallback = createFunction(args,
      interpolate(code[0], { 'setup': code.pop() }) +
      code.pop() +
      interpolate(code[1], { 'teardown': code.pop() })
    );

    // resolve time to achieve a percent uncertainty of 1%
    proto.MIN_TIME || (proto.MIN_TIME = max(timer.res / 2 / 0.01, 0.05));
    return clock.apply(null, arguments);
  }

  /**
   * Creates a function from the given arguments string and body.
   * @private
   * @param {String} args The comma separated function arguments.
   * @param {String} body The function body.
   * @returns {Function} The new function.
   */
  function createFunction() {
    var scripts,
        prop = 'c' + EMBEDDED_UID;

    createFunction = function(args, body) {
      var parent = scripts[0].parentNode,
          script = document.createElement('script');

      script.appendChild(document.createTextNode('Benchmark.' + prop + '=function(' + args + '){' + body + '}'));
      parent.removeChild(parent.insertBefore(script, scripts[0]));
      return [Benchmark[prop], delete Benchmark[prop]][0];
    };

    // fix JaegerMonkey bug
    // http://bugzil.la/639720
    try {
      scripts = document.getElementsByTagName('script');
      createFunction = createFunction('', 'return ' + EMBEDDED_UID)() == EMBEDDED_UID && createFunction;
    } catch (e) {
      createFunction = false;
    }
    createFunction || (createFunction = Function);
    return createFunction.apply(null, arguments);
  }

  /**
   * Wraps a function and passes `this` to the original function as the first argument.
   * @private
   * @param {Function} fn The function to be wrapped.
   * @returns {Function} The new function.
   */
  function methodize(fn) {
    return function() {
      return fn.apply(this, [this].concat(slice.call(arguments)));
    };
  }

  /**
   * Gets the critical value for the specified degrees of freedom.
   * @private
   * @param {Number} df The degrees of freedom.
   * @returns {Number} The critical value.
   */
  function getCriticalValue(df) {
    return T_DISTRIBUTION[Math.round(df) || 1] || T_DISTRIBUTION.Infinity;
  }

  /**
   * Computes the arithmetic mean of a sample.
   * @private
   * @param {Array} sample The sample.
   * @returns {Number} The mean.
   */
  function getMean(sample) {
    return reduce(sample, function(sum, x) {
      return sum + x;
    }, 0) / sample.length || 0;
  }

  /**
   * Gets the source code of a function.
   * @private
   * @param {Function} fn The function.
   * @returns {String} The function's source code.
   */
  function getSource(fn) {
    return trim((/^[^{]+{([\s\S]*)}\s*$/.exec(fn) || 0)[1] || '')
      .replace(/([^\n])$/, '$1\n');
  }

  /**
   * Sets the options of a benchmark.
   * @private
   * @param {Object} me The benchmark instance.
   * @param {Object} [options={}] Options object.
   */
  function setOptions(me, options) {
    options = extend(extend({ }, me.constructor.options), options);
    me.options = each(options, function(value, key) {
      // add event listeners
      if (/^on[A-Z]/.test(key)) {
        each(key.split(' '), function(key) {
          me.on(key.slice(2).toLowerCase(), value);
        });
      } else {
        me[key] = value;
      }
    });
  }

  /*--------------------------------------------------------------------------*/

  /**
   * A bare-bones `Array#forEach`/`for-in` own property solution.
   * Callbacks may terminate the loop by explicitly returning `false`.
   * @static
   * @member Benchmark
   * @param {Array|Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {Array|Object} Returns the object iterated over.
   */
  function each(object, callback) {
    var i = -1,
        length = object.length;

    if (hasKey(object, 'length') && length > -1 && length < 4294967296) {
      while (++i < length) {
        if (i in object && callback(object[i], i, object) === false) {
          break;
        }
      }
    } else {
      for (i in object) {
        if (hasKey(object, i) && callback(object[i], i, object) === false) {
          break;
        }
      }
    }
    return object;
  }

  /**
   * Copies own/inherited properties of a source object to the destination object.
   * @static
   * @member Benchmark
   * @param {Object} destination The destination object.
   * @param {Object} [source={}] The source object.
   * @returns {Object} The destination object.
   */
  function extend(destination, source) {
    source || (source = { });
    for (var key in source) {
      destination[key] = source[key];
    }
    return destination;
  }

  /**
   * A generic bare-bones `Array#filter` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function|String} callback The function/alias called per iteration.
   * @returns {Array} A new array of values that passed callback filter.
   * @example
   *
   * // get odd numbers
   * Benchmark.filter([1, 2, 3, 4, 5], function(n) {
   *   return n % 2;
   * }); // -> [1, 3, 5];
   *
   * // get fastest benchmarks
   * Benchmark.filter(benches, 'fastest');
   *
   * // get slowest benchmarks
   * Benchmark.filter(benches, 'slowest');
   *
   * // get benchmarks that completed without erroring
   * Benchmark.filter(benches, 'successful');
   */
  function filter(array, callback) {
    var result;
    if (callback == 'successful') {
      // callback to exclude errored or unrun benchmarks
      callback = function(bench) { return bench.cycles; };
    }
    else if (/^(?:fast|slow)est$/.test(callback)) {
      // get successful, sort by period + margin of error, and filter fastest/slowest
      result = filter(array, 'successful').sort(function(a, b) {
        a = a.stats;
        b = b.stats;
        return (a.mean + a.ME > b.mean + b.ME ? 1 : -1) * (callback == 'fastest' ? 1 : -1);
      });
      result = filter(result, function(bench) {
        return !result[0].compare(bench);
      });
    }
    return result || reduce(array, function(result, value, index) {
      return callback(value, index, array) ? result.push(value) && result : result;
    }, []);
  }

  /**
   * Converts a number to a more readable comma-separated string representation.
   * @static
   * @member Benchmark
   * @param {Number} number The number to convert.
   * @returns {String} The more readable string representation.
   */
  function formatNumber(number) {
    number = String(number).split('.');
    return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') + (number[1] ? '.' + number[1] : '');
  }

  /**
   * Checks if an object has the specified key as a direct property.
   * @static
   * @member Benchmark
   * @param {Object} object The object to check.
   * @param {String} key The key to check for.
   * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
   */
  function hasKey(object, key) {
    var result,
        parent = (object.constructor || Object).prototype;

    // for modern browsers
    object = Object(object);
    if (isClassOf(hasOwnProperty, 'Function')) {
      result = hasOwnProperty.call(object, key);
    }
    // for Safari 2
    else if (cache.__proto__ == Object.prototype) {
      object.__proto__ = [object.__proto__, object.__proto__ = null, result = key in object][0];
    }
    // for others (not as accurate)
    else {
      result = key in object && !(key in parent && object[key] === parent[key]);
    }
    return result;
  }

  /**
   * A generic bare-bones `Array#indexOf` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Mixed} value The value to search for.
   * @returns {Number} The index of the matched value or `-1`.
   */
  function indexOf(array, value) {
    var result = -1;
    each(array, function(v, i) {
      if (v === value) {
        result = i;
        return false;
      }
    });
    return result;
  }

  /**
   * Invokes a method on all items in an array.
   * @static
   * @member Benchmark
   * @param {Array} benches Array of benchmarks to iterate over.
   * @param {String|Object} name The name of the method to invoke OR options object.
   * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
   * @returns {Array} A new array of values returned from each method invoked.
   * @example
   *
   * // invoke `reset` on all benchmarks
   * Benchmark.invoke(benches, 'reset');
   *
   * // invoke `emit` with arguments
   * Benchmark.invoke(benches, 'emit', 'complete', listener);
   *
   * // invoke `run(true)`, treat benchmarks as a queue, and register invoke callbacks
   * Benchmark.invoke(benches, {
   *
   *   // invoke the `run` method
   *   'name': 'run',
   *
   *   // pass a single argument
   *   'args': true,
   *
   *   // treat as queue, removing benchmarks from front of `benches` until empty
   *   'queued': true,
   *
   *   // called before any benchmarks have been invoked.
   *   'onStart': onStart,
   *
   *   // called between invoking benchmarks
   *   'onCycle': onCycle,
   *
   *   // called after all benchmarks have been invoked.
   *   'onComplete': onComplete
   * });
   */
  function invoke(benches, name) {
    var args,
        async,
        bench,
        queued,
        i = 0,
        options = { 'onStart': noop, 'onCycle': noop, 'onComplete': noop },
        result = slice.call(benches, 0);

    function execute() {
      var listeners;
      if (async) {
        // use `next` as a listener
        bench.on('complete', next);
        listeners = bench.events['complete'];
        listeners.splice(0, 0, listeners.pop());
      }
      // execute method
      result[i] = bench[name].apply(bench, args);
      // if synchronous return true until finished
      return async || next();
    }

    function next() {
      var last = bench;
      bench = false;

      if (async) {
        last.removeListener('complete', next);
        last.emit('complete');
      }
      // choose next benchmark if not exiting early
      if (options.onCycle.call(benches, last) !== false) {
        if (queued) {
          // use generic shift
          shift.call(benches);
          bench = benches[0];
        } else {
          bench = benches[++i];
        }
      }
      if (bench) {
        if (async) {
          call(bench, execute, async);
        } else {
          return true;
        }
      } else {
        options.onComplete.call(benches, last);
      }
      // when async the `return false` will cancel the rest of the "complete"
      // listeners because they were called above and when synchronous it will
      // end the while-loop
      return false;
    }

    // juggle arguments
    if (isClassOf(name, 'String')) {
      args = slice.call(arguments, 2);
    } else {
      options = extend(options, name);
      name = options.name;
      args = isArray(args = 'args' in options ? options.args : []) ? args : [args];
      queued = options.queued;
    }
    // async for use with Benchmark#run only
    if (name == 'run') {
      async = (args[0] == null ? Benchmark.prototype.DEFAULT_ASYNC :
        args[0]) && HAS_TIMEOUT_API;
    }
    // start iterating over the array
    if (bench = benches[0]) {
      options.onStart.call(benches, bench);
      if (async) {
        call(bench, execute, async);
      } else {
        result.length = 0;
        while (execute());
      }
    }
    return result;
  }

  /**
   * Modify a string by replacing named tokens with matching object property values.
   * @static
   * @member Benchmark
   * @param {String} string The string to modify.
   * @param {Object} object The template object.
   * @returns {String} The modified string.
   * @example
   *
   * Benchmark.interpolate('#{greet} #{who}!', {
   *   'greet': 'Hello',
   *   'who': 'world'
   * }); // -> 'Hello world!'
   */
  function interpolate(string, object) {
    string = string == null ? '' : string;
    each(object || { }, function(value, key) {
      string = string.replace(RegExp('#\\{' + key + '\\}', 'g'), String(value));
    });
    return string;
  }

  /**
   * Determines if the given value is an array.
   * @static
   * @member Benchmark
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if value is an array, else `false`.
   */
  function isArray(value) {
    return isClassOf(value, 'Array');
  }

  /**
   * Checks if an object is of the specified class.
   * @static
   * @member Benchmark
   * @param {Object} object The object.
   * @param {String} name The name of the class.
   * @returns {Boolean} Returns `true` if of the class, else `false`.
   */
  function isClassOf(object, name) {
    return object != null && {}.toString.call(object).slice(8, -1) == name;
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of object, function, or unknown.
   * @static
   * @member Benchmark
   * @param {Mixed} object The owner of the property.
   * @param {String} property The property to check.
   * @returns {Boolean} Returns `true` if the property value is a non-primitive, else `false`.
   */
  function isHostType(object, property) {
    return !/^(?:boolean|number|string|undefined)$/
      .test(typeof object[property]) && !!object[property];
  }

  /**
   * Creates a string of joined array values or object key-value pairs.
   * @static
   * @member Benchmark
   * @param {Array|Object} object The object to operate on.
   * @param {String} [separator1=','] The separator used between key-value pairs.
   * @param {String} [separator2=': '] The separator used between keys and values.
   * @returns {String} The joined result.
   */
  function join(object, separator1, separator2) {
    var pairs = [];
    if (isArray(object)) {
      pairs = object;
    }
    else {
      separator2 || (separator2 = ': ');
      each(object, function(value, key) {
        pairs.push(key + separator2 + value);
      });
    }
    return pairs.join(separator1 || ',');
  }

  /**
   * A generic bare-bones `Array#map` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {Array} A new array of values returned by the callback.
   */
  function map(array, callback) {
    return reduce(array, function(result, value, index) {
      result.push(callback(value, index, array));
      return result;
    }, []);
  }

  /**
   * A no-operation function.
   * @static
   * @member Benchmark
   */
  function noop() {
    // no operation performed
  }

  /**
   * Retrieves the value of a specified property from all items in an array.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {String} property The property to pluck.
   * @returns {Array} A new array of property values.
   */
  function pluck(array, property) {
    return map(array, function(object) {
      return object[property];
    });
  }

  /**
   * A generic bare-bones `Array#reduce` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} accumulator Initial value of the accumulator.
   * @returns {Mixed} The accumulator.
   */
  function reduce(array, callback, accumulator) {
    each(array, function(value, index) {
      accumulator = callback(accumulator, value, index, array);
    });
    return accumulator;
  }

  /**
   * A generic bare-bones `String#trim` solution.
   * @static
   * @member Benchmark
   * @param {String} string The string to trim.
   * @returns {String} The trimmed string.
   */
  function trim(string) {
    return String(string).replace(/^\s+/, '').replace(/\s+$/, '');
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Aborts all benchmarks in the suite.
   * @name abort
   * @member Benchmark.Suite
   * @returns {Object} The suite instance.
   */
  function abortSuite() {
    var me = this;
    me.aborted = true;
    me.running = false;
    invoke(me, 'abort');
    me.emit('abort');
    return me;
  }

  /**
   * Adds a test to the benchmark suite.
   * @member Benchmark.Suite
   * @param {String} name A name to identify the benchmark.
   * @param {Function} fn The test to benchmark.
   * @param {Object} [options={}] Options object.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * suite.add(fn);
   *
   * // or using a name first
   * suite.add('foo', fn);
   *
   * // or with options
   * suite.add('foo', fn, {
   *   'onCycle': onCycle,
   *   'onComplete': onComplete
   * });
   */
  function add(name, fn, options) {
    var me = this,
        bench = new Benchmark(HEADLESS);

    Benchmark.call(bench, name, fn, options);
    me.push(bench);
    me.emit('add', bench);
    return me;
  }

  /**
   * Creates a new suite with cloned benchmarks.
   * @name clone
   * @member Benchmark.Suite
   * @param {Object} options Options object to overwrite cloned options.
   * @returns {Object} The new suite instance.
   */
  function cloneSuite(options) {
    var me = this,
        result = new me.constructor(extend(extend({ }, me.options), options));
    // copy own properties
    each(me, function(value, key) {
      if (!hasKey(result, key)) {
        result[key] = /^\d+$/.test(key) ? value.clone() : value;
      }
    });
    return result.reset();
  }

  /**
   * A bare-bones `Array#filter` solution.
   * @name filter
   * @member Benchmark.Suite
   * @param {Function|String} callback The function/alias called per iteration.
   * @returns {Object} A new suite of benchmarks that passed callback filter.
   */
  function filterSuite(callback) {
    var me = this,
        result = new me.constructor;

    result.push.apply(result, filter(me, callback));
    return result;
  }

  /**
   * Resets all benchmarks in the suite.
   * @name reset
   * @member Benchmark.Suite
   * @returns {Object} The suite instance.
   */
  function resetSuite() {
    var me = this;
    me.aborted = me.running = false;
    invoke(me, 'reset');
    me.emit('reset');
    return me;
  }

  /**
   * Runs the suite.
   * @name run
   * @member Benchmark.Suite
   * @param {Boolean} [async=false] Flag to run asynchronously.
   * @param {Boolean} [queued=false] Flag to treat benchmarks as a queue.
   * @returns {Object} The suite instance.
   */
  function runSuite(async, queued) {
    var me = this;
    me.reset();
    me.running = true;
    invoke(me, {
      'name': 'run',
      'args': async,
      'queued': queued,
      'onStart': function(bench) {
        me.emit('start', bench);
      },
      'onCycle': function(bench) {
        if (bench.error) {
          me.emit('error', bench);
        }
        return !me.aborted && me.emit('cycle', bench);
      },
      'onComplete': function(bench) {
        me.running = false;
        me.emit('complete', bench);
      }
    });
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Registers a single listener of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @param {Function} listener The function called when the event occurs.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.addListener('cycle', listener);
   *
   * // register a listener for multiple event types
   * bench.addListener('start cycle', listener);
   */
  function addListener(type, listener) {
    var me = this,
        events = me.events || (me.events = { });

    each(type.split(' '), function(type) {
      (events[type] || (events[type] = [])).push(listener);
    });
    return me;
  }

  /**
   * Executes all registered listeners of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   */
  function emit(type) {
    var me = this,
        args = slice.call(arguments, 1),
        events = me.events,
        listeners = events && events[type] || [],
        successful = true;

    each(listeners, function(listener) {
      if (listener.apply(me, args) === false) {
        successful = false;
        return successful;
      }
    });
    return successful;
  }

  /**
   * Unregisters a single listener of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @param {Function} listener The function to unregister.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.removeListener('cycle', listener);
   *
   * // unregister a listener for multiple event types
   * bench.removeListener('start cycle', listener);
   */
  function removeListener(type, listener) {
    var me = this,
        events = me.events;

    each(type.split(' '), function(type) {
      var listeners = events && events[type] || [],
          index = indexOf(listeners, listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    });
    return me;
  }

  /**
   * Unregisters all listeners of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.removeAllListeners('cycle');
   *
   * // unregister all listeners for multiple event types
   * bench.removeListener('start cycle');
   */
  function removeAllListeners(type) {
    var me = this,
        events = me.events;

    each(type.split(' '), function(type) {
      (events && events[type] || []).length = 0;
    });
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Aborts the benchmark without recording times.
   * @member Benchmark
   * @returns {Object} The benchmark instance.
   */
  function abort() {
    var me = this;
    if (me.running) {
      if (me.timerId && HAS_TIMEOUT_API) {
        clearTimeout(me.timerId);
        delete me.timerId;
      }
      // set running as NaN so reset() will detect it as falsey and *not* call abort(),
      // but *will* detect it as a change and fire the onReset() callback
      me.running = NaN;
      me.reset();
      me.aborted = true;
      me.emit('abort');
    }
    return me;
  }

  /**
   * Creates a new benchmark using the same test and options.
   * @member Benchmark
   * @param {Object} options Options object to overwrite cloned options.
   * @returns {Object} The new benchmark instance.
   * @example
   *
   * var bizarro = bench.clone({
   *   'name': 'doppelganger'
   * });
   */
  function clone(options) {
    var me = this,
        result = new me.constructor(me.fn, extend(extend({ }, me.options), options));
    // copy own properties
    each(me, function(value, key) {
      if (!hasKey(result, key)) {
        result[key] = value;
      }
    });
    return result.reset();
  }

  /**
   * Determines if the benchmark's period is smaller than another.
   * @member Benchmark
   * @param {Object} other The benchmark to compare.
   * @returns {Number} Returns `1` if smaller, `-1` if larger, and `0` if indeterminate.
   */
  function compare(other) {
    // unpaired two-sample t-test assuming equal variance
    // http://en.wikipedia.org/wiki/Student's_t-test
    // http://www.chem.utoronto.ca/coursenotes/analsci/StatsTutorial/12tailed.html
    var a = this.stats,
        b = other.stats,
        df = a.size + b.size - 2,
        pooled = (((a.size - 1) * a.variance) + ((b.size - 1) * b.variance)) / df,
        tstat = (a.mean - b.mean) / sqrt(pooled * (1 / a.size + 1 / b.size)),
        near = abs(1 - a.mean / b.mean) < 0.055 && a.RME < 3 && b.RME < 3;

    // check if the means aren't close and the t-statistic is significant
    return !near && abs(tstat) > getCriticalValue(df) ? (tstat > 0 ? -1 : 1) : 0;
  }

  /**
   * Reset properties and abort if running.
   * @member Benchmark
   * @returns {Object} The benchmark instance.
   */
  function reset() {
    var changed,
        pair,
        me = this,
        source = extend(extend({ }, me.constructor.prototype), me.options),
        pairs = [[source, me]];

    function check(value, key) {
      var other = pair[1][key];
      if (value && isClassOf(value, 'Object')) {
        pairs.push([value, other]);
      }
      else if (!isClassOf(value, 'Function') &&
          key != 'created' && value != other) {
        pair[1][key] = value;
        changed = true;
      }
    }

    if (me.running) {
      // no worries, reset() is called within abort()
      me.abort();
      me.aborted = source.aborted;
    }
    else {
      // check if properties have changed and reset them
      while (pairs.length) {
        each((pair = pairs.pop(), pair[0]), check);
      }
      if (changed) {
        me.emit('reset');
      }
    }
    return me;
  }

  /**
   * Displays relevant benchmark information when coerced to a string.
   * @member Benchmark
   * @returns {String} A string representation of the benchmark instance.
   */
  function toString() {
    var me = this,
        error = me.error,
        hz = me.hz,
        stats = me.stats,
        size = stats.size,
        pm = IN_JAVA ? '+/-' : '\xb1',
        result = me.name || me.id || ('<Test #' + me.fn.uid + '>');

    if (error) {
      result += ': ' + join(error);
    } else {
      result += ' x ' + formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) + ' ops/sec ' + pm +
        stats.RME.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)';
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Computes stats on benchmark results.
   * @private
   * @param {Object} me The benchmark instance.
   * @param {Boolean} [async=false] Flag to run asynchronously.
   */
  function compute(me, async) {
    var queue = [],
        sample = [],
        runCount = me.INIT_RUN_COUNT;

    function enqueue(count) {
      while (count--) {
        queue.push(me.clone({
          'computing': me,
          'events': { 'start': [update], 'cycle': [update] }
        }));
      }
    }

    function update() {
      // port changes from clone to host
      var clone = this;
      if (me.running) {
        if (clone.cycles) {
          // the me.count and me.cycles props of the host are updated in cycle() below
          me.hz = clone.hz;
          me.times.period = clone.times.period;
          me.INIT_RUN_COUNT = clone.INIT_RUN_COUNT;
          me.emit('cycle');
        }
        else if (clone.error) {
          me.abort();
          me.error = clone.error;
          me.emit('error');
        }
        else {
          // on start
          clone.count = me.INIT_RUN_COUNT;
        }
      } else if (me.aborted) {
        clone.abort();
      }
    }

    function evaluate(clone) {
      var mean,
          moe,
          rme,
          sd,
          sem,
          variance,
          now = +new Date,
          times = me.times,
          aborted = me.aborted,
          elapsed = (now - times.start) / 1e3,
          maxedOut = elapsed > me.MAX_TIME_ELAPSED,
          size = sample.push(clone.times.period),
          varOf = function(sum, x) { return sum + pow(x - mean, 2); };

      // exit early for aborted or unclockable tests
      if (aborted || clone.hz == Infinity) {
         maxedOut = !(size = sample.length = queue.length = 0);
      }
      // simulate onComplete and enqueue additional runs if needed
      if (queue.length < 2) {
        // sample mean (estimate of the population mean)
        mean = getMean(sample);
        // sample variance (estimate of the population variance)
        variance = reduce(sample, varOf, 0) / (size - 1);
        // sample standard deviation (estimate of the population standard deviation)
        sd = sqrt(variance);
        // standard error of the mean (aka the standard deviation of the sampling distribution of the sample mean)
        sem = sd / sqrt(size);
        // margin of error
        moe = sem * getCriticalValue(size - 1);
        // relative margin of error
        rme = (moe / mean) * 100 || 0;

        // if time permits, increase sample size to reduce the margin of error
        if (!maxedOut) {
          enqueue(1);
        }
        else {
          // set host values
          if (!aborted) {
            me.running = false;
            times.stop = now;
            times.elapsed = elapsed;
            extend(me.stats, {
              'ME': moe,
              'RME': rme,
              'SEM': sem,
              'deviation': sd,
              'mean': mean,
              'size': size,
              'variance': variance
            });

            if (me.hz != Infinity) {
              times.period = mean;
              times.cycle = mean * me.count;
              me.hz = 1 / mean;
            }
          }
          me.INIT_RUN_COUNT = runCount;
          me.emit('complete');
        }
      }
      return !aborted;
    }

    // init sample/queue and begin
    enqueue(me.MIN_SAMPLE_SIZE);
    invoke(queue, { 'name': 'run', 'args': async, 'queued': true, 'onCycle': evaluate });
  }

  /**
   * Runs the benchmark.
   * @member Benchmark
   * @param {Boolean} [async=false] Flag to run asynchronously.
   * @returns {Object} The benchmark instance.
   */
  function run(async) {
    var me = this;

    function cycle() {
      var clocked,
          divisor,
          minTime,
          period,
          count = me.count,
          host = me.computing,
          times = me.times;

      // continue, if not aborted between cycles
      if (me.running) {
        me.cycles++;
        host.cycles++;
        host.count = count;

        try {
          clocked = clock(host);
          minTime = me.MIN_TIME;
        } catch(e) {
          me.abort();
          me.error = e;
          me.emit('error');
        }
      }
      // continue, if not errored
      if (me.running) {
        // time taken to complete last test cycle
        times.cycle = clocked;
        // seconds per operation
        period = times.period = clocked / count;
        // ops per second
        me.hz = 1 / period;
        // do we need to do another cycle?
        me.running = clocked < minTime;
        // avoid working our way up to this next time
        me.INIT_RUN_COUNT = count;

        if (me.running) {
          // tests may clock at 0 when INIT_RUN_COUNT is a small number,
          // to avoid that we set its count to something a bit higher
          if (!clocked && (divisor = CYCLE_DIVISORS[me.cycles]) != null) {
            count = Math.floor(4e6 / divisor);
          }
          // calculate how many more iterations it will take to achive the MIN_TIME
          if (count <= me.count) {
            count += Math.ceil((minTime - clocked) / period);
          }
          me.running = count != Infinity;
        }
      }
      // should we exit early?
      if (me.emit('cycle') === false) {
        me.abort();
      }
      // figure out what to do next
      if (me.running) {
        me.count = count;
        call(me, cycle, async);
      } else {
        // fix TraceMonkey bug
        // http://bugzil.la/509069
        if (window.Benchmark == Benchmark) {
          window.Benchmark = 1;
          window.Benchmark = Benchmark;
        }
        me.emit('complete');
      }
    }

    // set running to false so reset() won't call abort()
    me.running = false;
    me.reset();
    me.running = true;

    me.count = me.INIT_RUN_COUNT;
    me.times.start = +new Date;
    me.emit('start');

    async = (async == null ? me.DEFAULT_ASYNC : async) && HAS_TIMEOUT_API;
    if (me.computing) {
      cycle();
    } else {
      compute(me, async);
    }
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Platform object containing browser name, version, and operating system.
   * @static
   * @member Benchmark
   * @type Object
   */
  Benchmark.platform = (function() {
    var me = this,
        alpha = IN_JAVA ? 'a' : '\u03b1',
        beta = IN_JAVA ? 'b' : '\u03b2',
        description = [],
        doc = window.document || {},
        nav = window.navigator || {},
        ua = nav.userAgent || 'unknown platform',
        layout = /Gecko|Trident|WebKit/.exec(ua),
        data = { '6.1': 'Server 2008 R2 / 7', '6.0': 'Server 2008 / Vista', '5.2': 'Server 2003 / XP x64', '5.1': 'XP', '5.0': '2000', '4.0': 'NT', '4.9': 'ME' },
        name = 'Avant Browser,Camino,Epiphany,Fennec,Flock,Galeon,GreenBrowser,iCab,Iron,K-Meleon,Konqueror,Lunascape,Maxthon,Minefield,Nook Browser,RockMelt,SeaMonkey,Sleipnir,SlimBrowser,Sunrise,Swiftfox,Opera Mini,Opera,Chrome,Firefox,IE,Safari',
        os = 'Android,Cygwin,SymbianOS,webOS[ /]\\d,Linux,Mac OS(?: X)?,Macintosh,Windows 98;,Windows ',
        product = 'BlackBerry\\s?\\d+,iP[ao]d,iPhone,Kindle,Nokia,Nook,PlayBook,Samsung,Xoom',
        version = isClassOf(window.opera, 'Opera') && opera.version();

    function format(string) {
      // trim and conditionally capitalize
      return /^(?:webOS|i(?:OS|P))/.test(string = trim(string)) ? string :
        string.charAt(0).toUpperCase() + string.slice(1);
    }

    name = reduce(name.split(','), function(name, guess) {
      return name || RegExp(guess + '\\b', 'i').exec(ua) && guess;
    });

    product = reduce(product.split(','), function(product, guess) {
      if (!product && (product = RegExp(guess + '[^ ();-]*', 'i').exec(ua))) {
        // correct character case and split by forward slash
        if ((product = String(product).replace(RegExp(guess = /\w+/.exec(guess), 'i'), guess).split('/'))[1]) {
          if (/[\d.]+/.test(product[0])) {
            version = version || product[1];
          } else {
            product[0] += ' ' + product[1];
          }
        }
        product = format(product[0].replace(/([a-z])(\d)/i, '$1 $2').split('-')[0]);
      }
      return product;
    });

    os = reduce(os.split(','), function(os, guess) {
      if (!os && (os = RegExp(guess + '[^();/-]*').exec(ua))) {
        // platform tokens defined at
        // http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
        if (/^win/i.test(os) && (data = data[0/*opera fix*/,/[456]\.\d/.exec(os)])) {
          os = 'Windows ' + data;
        }
        // normalize iOS
        else if (/^iP/.test(product)) {
          name || (name = 'Safari');
          os = 'iOS' + ((data = /\bOS ([\d_]+)/.exec(ua)) ? ' ' + data[1] : '');
        }
        // cleanup
        os = String(os).replace(RegExp(guess = /\w+/.exec(guess), 'i'), guess)
          .replace(/\/(\d)/, ' $1').replace(/_/g, '.').replace(/x86\.64/g, 'x86_64')
          .replace('Macintosh', 'Mac OS').replace(/(OS X) Mach$/, '$1').split(' on ')[0];
      }
      return os;
    });

    // detect simulator
    if (/Simulator/i.exec(ua)) {
      product = (product ? product + ' ' : '') + 'Simulator';
    }
    // detect non Firefox Gecko/Safari WebKit based browsers
    if (ua && (data = /^(?:Firefox|Safari|null)/.exec(name))) {
      if (name && !product && /[/,]/.test(ua.slice(ua.indexOf(data + '/') + 8))) {
        name = null;
      }
      if ((data = product || os) && !/^(?:iP|Lin|Mac|Win)/.test(data)) {
        name = /[a-z]+/i.exec(/^And/.test(os) && os || data) + ' Browser';
      }
    }
    // detect non Opera versions
    if (!version) {
      version = reduce(['version', name, 'AdobeAIR', 'Firefox', 'NetFront'], function(version, guess) {
        return version || (RegExp(guess + '(?:-[\\d.]+/|[ /-])([^ ();/-]*)', 'i').exec(ua) || 0)[1] || null;
      });
    }
    // detect server-side js
    if (me && isHostType(me, 'global')) {
      if (typeof exports == 'object' && exports) {
        if (me == window && typeof system == 'object' && (data = system)) {
          name = data.global == global ? 'Narwhal' : 'RingoJS';
          os = data.os || null;
        }
        else if (typeof process == 'object' && (data = process)) {
          name = 'Node.js';
          version = /[\d.]+/.exec(data.version)[0];
          os = data.platform;
        }
      } else if (isClassOf(me.environment, 'Environment')) {
        name = 'Rhino';
      }
      if (IN_JAVA && !os) {
        os = String(java.lang.System.getProperty('os.name'));
      }
    }
    // detect Adobe AIR
    else if (IN_AIR) {
      name = 'Adobe AIR';
      os = runtime.flash.system.Capabilities.os;
    }
    // detect PhantomJS
    else if (isClassOf(data = window.phantom, 'RuntimeObject')) {
      name = 'PhantomJS';
      version = (data = data.version) && (data.major + '.' + data.minor + '.' + data.patch);
    }
    // detect IE compatibility mode
    else if (typeof doc.documentMode == 'number' && (data = /Trident\/(\d+)/.exec(ua))) {
      version = [version, doc.documentMode];
      version[1] = (data = +data[1] + 4) != version[1] ? (layout = null, description.push('running in IE ' + version[1] + ' mode'), data) : version[1];
      version = name == 'IE' ? String(version[1].toFixed(1)) : version[0];
    }
    // detect release phases
    if (version && (data = /(?:[ab]|dp|pre|[ab]\d+pre)(?:\d+\+?)?$/i.exec(version) || /(?:alpha|beta)(?: ?\d)?/i.exec(ua + ';' + nav.appMinorVersion))) {
      version = version.replace(RegExp(data + '\\+?$'), '') + (/^b/i.test(data) ? beta : alpha) + (/\d+\+?/.exec(data) || '');
    }
    // detect Maxthon's unreliable version info
    if (/^Max/.test(name)) {
      version = version && version.replace(/\.[.\d]*/, '.x');
    }
    // detect Firefox nightly
    else if (/^Min/.test(name)) {
      name = 'Firefox';
      version = RegExp(alpha + '|' + beta + '|null').test(version) ? version : version + alpha;
    }
    // detect mobile
    else if (name && (!product || name == 'IE') && !/Bro/.test(name) && /Mobi/.test(ua)) {
      name += ' Mobile';
    }
    // detect unspecified Chrome/Safari versions
    if (data = (/AppleWebKit\/(\d+(?:\.\d+)?)/.exec(ua) || 0)[1]) {
      if (/^And/.exec(os)) {
        data = data < 530 ? 1 : data < 532 ? 2 : data < 532.5 ? 3 : data < 533 ? 4 : data < 534.3 ? 5 : data < 534.7 ? 6 : data < 534.10 ? 7 : data < 534.13 ? 8 : data < 534.16 ? 9 : '10';
        layout = 'like Chrome';
      } else {
        data = data < 400 ? 1 : data < 500 ? 2 : data < 526 ? 3 : data < 533 ? 4 : '4';
        layout = 'like Safari';
      }
      layout += ' ' + (data += typeof data == 'number' ? '.x' : '+');
      version = name == 'Safari' && (!version || parseInt(version) > 45) ? data : version;
    }
    // detect platform preview
    if (RegExp(alpha + '|' + beta).test(version) && typeof external == 'object' && !external) {
      layout = layout && !/like /.test(layout) ? 'rendered by ' + layout : layout;
      description.unshift('platform preview');
    }
    // add layout engine
    if (layout && /Ado|Bro|Lun|Max|Pha|Sle/.test(name)) {
      description.push(layout);
    }
    // combine contextual information
    if (description.length) {
      description = ['(' + description.join('; ') + ')'];
    }
    // append product
    if (product && String(name).indexOf(product) < 0) {
      description.push('on ' + product);
    }
    // add browser/os architecture
    if (/\b(?:WOW|x|IA)64\b/.test(ua)) {
      os = os && os + (/64/.test(os) ? '' : ' x64');
      if (name && (/WOW64/.test(ua) || /\w(?:86|32)$/.test(nav.cpuClass || nav.platform))) {
        description.unshift('x86');
      }
    }
    return {
      'version': name && version && description.unshift(version) && version,
      'name': name && description.unshift(name) && name,
      'os': name && (os = os && format(os)) && description.push(product ? '(' + os + ')' : 'on ' + os) && os,
      'product': product,
      'description': description.length ? description.join(' ') : ua,
      'toString': function() { return this.description; }
    };
  }());

  /*--------------------------------------------------------------------------*/

  extend(Benchmark, {

    /**
     * The version number.
     * @static
     * @member Benchmark
     * @type String
     */
    'version': '0.2.1',

    /**
     * The default options object copied by instances.
     * @static
     * @member Benchmark
     * @type Object
     */
    'options': { },

    // generic Array#forEach/for-in
    'each': each,

    // copy properties to another object
    'extend': extend,

    // generic Array#filter
    'filter': filter,

    // converts a number to a comma-separated string
    'formatNumber': formatNumber,

    // xbrowser Object#hasOwnProperty
    'hasKey': hasKey,

    // generic Array#indexOf
    'indexOf': indexOf,

    // invokes a method on each item in an array
    'invoke': invoke,

    // modifies a string using a template object
    'interpolate': interpolate,

    // xbrowser Array.isArray
    'isArray': isArray,

    // checks internal [[Class]] of an object
    'isClassOf': isClassOf,

    // checks if an object's property is a non-primitive value
    'isHostType': isHostType,

    // generic Array#join for arrays and objects
    'join': join,

    // generic Array#map
    'map': map,

    // no operation
    'noop': noop,

    // retrieves a property value from each item in an array
    'pluck': pluck,

    // generic Array#reduce
    'reduce': reduce,

    // generic String#trim
    'trim': trim
  });

  /*--------------------------------------------------------------------------*/

  // IE may ignore `toString` in a for-in loop
  Benchmark.prototype.toString = toString;

  extend(Benchmark.prototype, {

    /**
     * The delay between test cycles (secs).
     * @member Benchmark
     * @type Number
     */
    'CYCLE_DELAY': 0.005,

    /**
     * A flag to indicate methods will run asynchronously by default.
     * @member Benchmark
     * @type Boolean
     */
    'DEFAULT_ASYNC': false,

    /**
     * The default number of times to execute a test on a benchmark's first cycle.
     * @member Benchmark
     * @type Number
     */
    'INIT_RUN_COUNT': 5,

    /**
     * The maximum time a benchmark is allowed to run before finishing (secs).
     * @member Benchmark
     * @type Number
     */
    'MAX_TIME_ELAPSED': 5,

    /**
     * The minimum sample size required to perform statistical analysis.
     * @member Benchmark
     * @type Number
     */
    'MIN_SAMPLE_SIZE': 5,

    /**
     * The time needed to reduce the percent uncertainty of measurement to 1% (secs).
     * @member Benchmark
     * @type Number
     */
    'MIN_TIME': 0,

    /**
     * The number of times a test was executed.
     * @member Benchmark
     * @type Number
     */
    'count': 0,

    /**
     * A timestamp of when the benchmark was created.
     * @member Benchmark
     * @type Number
     */
    'created': 0,

    /**
     * The number of cycles performed while benchmarking.
     * @member Benchmark
     * @type Number
     */
    'cycles': 0,

    /**
     * The error object if the test failed.
     * @member Benchmark
     * @type Object|Null
     */
    'error': null,

    /**
     * The number of executions per second.
     * @member Benchmark
     * @type Number
     */
    'hz': 0,

    /**
     * A flag to indicate if the benchmark is aborted.
     * @member Benchmark
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the benchmark is running.
     * @member Benchmark
     * @type Boolean
     */
    'running': false,

    /**
     * Alias of [`Benchmark#addListener`](#Benchmark:addListener).
     * @member Benchmark, Benchmark.Suite
     */
    'on': addListener,

    /**
     * Compiled into the test and executed immediately **before** the test loop.
     * @member Benchmark
     * @type Function
     * @example
     *
     * var bench = new Benchmark({
     *   'fn': function() {
     *     a += 1;
     *   },
     *   'setup': function() {
     *     // reset local var `a` at the beginning of each test cycle
     *     a = 0;
     *   }
     * });
     *
     * // compiles into something like:
     * var a = 0;
     * var start = new Date;
     * while (count--) {
     *   a += 1;
     * }
     * var end = new Date - start;
     */
    'setup': noop,

    /**
     * Compiled into the test and executed immediately **after** the test loop.
     * @member Benchmark
     * @type Function
     */
    'teardown': noop,

    /**
     * An object of stats including mean, margin or error, and standard deviation.
     * @member Benchmark
     * @type Object
     */
    'stats': {

      /**
       * The margin of error.
       * @member Benchmark#stats
       * @type Number
       */
      'ME': 0,

      /**
       * The relative margin of error (expressed as a percentage of the mean).
       * @member Benchmark#stats
       * @type Number
       */
      'RME': 0,

      /**
       * The standard error of the mean.
       * @member Benchmark#stats
       * @type Number
       */
      'SEM': 0,

      /**
       * The sample standard deviation.
       * @member Benchmark#stats
       * @type Number
       */
      'deviation': 0,

      /**
       * The sample arithmetic mean.
       * @member Benchmark#stats
       * @type Number
       */
      'mean': 0,

      /**
       * The sample size.
       * @member Benchmark#stats
       * @type Number
       */
      'size': 0,

      /**
       * The sample variance.
       * @member Benchmark#stats
       * @type Number
       */
      'variance': 0
    },

    /**
     * An object of timing data including cycle, elapsed, period, start, and stop.
     * @member Benchmark
     * @type Object
     */
    'times': {

      /**
       * The time taken to complete the last cycle (secs)
       * @member Benchmark#times
       * @type Number
       */
      'cycle': 0,

      /**
       * The time taken to complete the benchmark (secs).
       * @member Benchmark#times
       * @type Number
       */
      'elapsed': 0,

      /**
       * The time taken to execute the test once (secs).
       * @member Benchmark#times
       * @type Number
       */
      'period': 0,

      /**
       * A timestamp of when the benchmark started (ms).
       * @member Benchmark#times
       * @type Number
       */
      'start': 0,

      /**
       * A timestamp of when the benchmark finished (ms).
       * @member Benchmark#times
       * @type Number
       */
      'stop': 0
    },

    // aborts benchmark (does not record times)
    'abort': abort,

    // registers a single listener
    'addListener': addListener,

    // creates a new benchmark using the same test and options
    'clone': clone,

    // compares benchmark's hertz with another
    'compare': compare,

    // executes listeners of a specified type
    'emit': emit,

    // removes all listeners of a specified type
    'removeAllListeners': removeAllListeners,

    // removes a single listener
    'removeListener': removeListener,

    // reset benchmark properties
    'reset': reset,

    // runs the benchmark
    'run': run
  });

  /*--------------------------------------------------------------------------*/

  /**
   * The default options object copied by instances.
   * @static
   * @member Benchmark.Suite
   * @type Object
   */
  Suite.options = { };

  /*--------------------------------------------------------------------------*/

  extend(Suite.prototype, {

    /**
     * The number of benchmarks in the suite.
     * @member Benchmark.Suite
     * @type Number
     */
    'length': 0,

    /**
     * A flag to indicate if the suite is aborted.
     * @member Benchmark.Suite
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the suite is running.
     * @member Benchmark.Suite
     * @type Boolean
     */
    'running': false,

    /**
     * A bare-bones `Array#forEach` solution.
     * Callbacks may terminate the loop by explicitly returning `false`.
     * @member Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @returns {Object} The suite iterated over.
     */
    'each': methodize(each),

    /**
     * A bare-bones `Array#indexOf` solution.
     * @member Benchmark.Suite
     * @param {Mixed} value The value to search for.
     * @returns {Number} The index of the matched value or `-1`.
     */
    'indexOf': methodize(indexOf),

    /**
     * Invokes a method on all benchmarks in the suite.
     * @member Benchmark.Suite
     * @param {String|Object} name The name of the method to invoke OR options object.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
     * @returns {Array} A new array of values returned from each method invoked.
     */
    'invoke': methodize(invoke),

    /**
     * A bare-bones `Array#map` solution.
     * @member Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @returns {Array} A new array of values returned by the callback.
     */
    'map': methodize(map),

    /**
     * Retrieves the value of a specified property from all benchmarks in the suite.
     * @member Benchmark.Suite
     * @param {String} property The property to pluck.
     * @returns {Array} A new array of property values.
     */
    'pluck': methodize(pluck),

    /**
     * A bare-bones `Array#reduce` solution.
     * @member Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} accumulator Initial value of the accumulator.
     * @returns {Mixed} The accumulator.
     */
    'reduce': methodize(reduce),

    // aborts all benchmarks in the suite
    'abort': abortSuite,

    // adds a benchmark to the suite
    'add': add,

    // registers a single listener
    'addListener': addListener,

    // creates a new suite with cloned benchmarks
    'clone': cloneSuite,

    // executes listeners of a specified type
    'emit': emit,

    // creates a new suite of filtered benchmarks
    'filter': filterSuite,

    // alias of addListener
    'on': addListener,

    // removes all listeners of a specified type
    'removeAllListeners': removeAllListeners,

    // removes a single listener
    'removeListener': removeListener,

    // resets all benchmarks in the suite
    'reset': resetSuite,

    // runs all benchmarks in the suite
    'run': runSuite,

    // array methods
    'concat': [].concat,

    'join': [].join,

    'pop': aloClean([].pop),

    'push': [].push,

    'reverse': [].reverse,

    'shift': shift,

    'slice': slice,

    'sort': [].sort,

    'splice': aloClean([].splice),

    'unshift': [].unshift
  });

  /*--------------------------------------------------------------------------*/

  // expose Suite
  Benchmark.Suite = Suite;

  // expose Benchmark
  if (typeof exports == 'object' && exports && typeof global == 'object' && global) {
    window = global;
    if (typeof module == 'object' && module && module.exports == exports) {
      module.exports = Benchmark;
    } else {
      exports.Benchmark = Benchmark;
    }
  } else {
    window.Benchmark = Benchmark;
  }

  // trigger clock's lazy define early to avoid a security error
  if (IN_AIR) {
    clock({ 'fn': noop, 'count': 1 });
  }

  // feature detect
  HAS_TIMEOUT_API = isHostType(window, 'setTimeout') &&
    isHostType(window, 'clearTimeout');

}(this));