require('./helper');

var renderHelper = require('./render-helper');

var tests = renderHelper.getTests();

describe('Mustache.render', function () {
  beforeEach(function () {
    Mustache.clearCache();
  });

  it('requires template to be a string', function () {
    assert.throws(function () {
      Mustache.render(['dummy template'], ['foo', 'bar']);
    }, TypeError, 'Invalid template! Template should be a "string" but ' +
                  '"array" was given as the first argument ' +
                  'for mustache#render(template, view, partials)');
  });

  describe('custom tags', function () {
    it('uses tags argument instead of Mustache.tags when given', function () {
      var template = '<<placeholder>>bar{{placeholder}}';

      Mustache.tags = ['{{', '}}'];
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, ['<<', '>>']), 'foobar{{placeholder}}');
    });
    
    it('uses config.tags argument instead of Mustache.tags when given', function () {
      var template = '<<placeholder>>bar{{placeholder}}';

      Mustache.tags = ['{{', '}}'];
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, { tags: ['<<', '>>']}),  'foobar{{placeholder}}');
    });

    it('uses tags argument instead of Mustache.tags when given, even when it previously rendered the template using Mustache.tags', function () {
      var template = '((placeholder))bar{{placeholder}}';

      Mustache.tags = ['{{', '}}'];
      Mustache.render(template, { placeholder: 'foo' });
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, ['((', '))']), 'foobar{{placeholder}}');
    });
    
    it('uses config.tags argument instead of Mustache.tags when given, even when it previously rendered the template using Mustache.tags', function () {
      var template = '((placeholder))bar{{placeholder}}';

      Mustache.tags = ['{{', '}}'];
      Mustache.render(template, { placeholder: 'foo' });
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, { tags: ['((', '))'] }), 'foobar{{placeholder}}');
    });

    it('uses tags argument instead of Mustache.tags when given, even when it previously rendered the template using different tags', function () {
      var template = '[[placeholder]]bar<<placeholder>>';

      Mustache.render(template, { placeholder: 'foo' }, {}, ['<<', '>>']);
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, ['[[', ']]']), 'foobar<<placeholder>>');
    });
    
    it('uses config.tags argument instead of Mustache.tags when given, even when it previously rendered the template using different tags', function () {
      var template = '[[placeholder]]bar<<placeholder>>';

      Mustache.render(template, { placeholder: 'foo' }, {}, ['<<', '>>']);
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, { tags: ['[[', ']]'] }), 'foobar<<placeholder>>');
    });

    it('does not mutate Mustache.tags when given tags argument', function () {
      var correctMustacheTags = ['{{', '}}'];
      Mustache.tags = correctMustacheTags;

      Mustache.render('((placeholder))', { placeholder: 'foo' }, {}, ['((', '))']);

      assert.equal(Mustache.tags, correctMustacheTags);
      assert.deepEqual(Mustache.tags, ['{{', '}}']);
    });
    
    it('does not mutate Mustache.tags when given config.tags argument', function () {
      var correctMustacheTags = ['{{', '}}'];
      Mustache.tags = correctMustacheTags;

      Mustache.render('((placeholder))', { placeholder: 'foo' }, {}, { tags: ['((', '))'] });

      assert.equal(Mustache.tags, correctMustacheTags);
      assert.deepEqual(Mustache.tags, ['{{', '}}']);
    });

    it('uses provided tags when rendering partials', function () {
      var output = Mustache.render('<%> partial %>', { name: 'Santa Claus' }, {
        partial: '<% name %>'
      }, ['<%', '%>']);

      assert.equal(output, 'Santa Claus');
    });
    
    it('uses provided config.tags when rendering partials', function () {
      var output = Mustache.render('<%> partial %>', { name: 'Santa Claus' }, {
        partial: '<% name %>'
      }, { tags: ['<%', '%>'] }); 

      assert.equal(output, 'Santa Claus');
    });
    
    it('uses config.escape argument instead of Mustache.escape when given', function () {
      var template = 'Hello, {{placeholder}}';
      
      function escapeBang (text) {
        return text + '!';
      }
      assert.equal(Mustache.render(template, { placeholder: 'world' }, {}, { escape: escapeBang }), 'Hello, world!');
    });

    it('uses config.escape argument instead of Mustache.escape when given, even when it previously rendered the template using Mustache.escape', function () {
      var template = 'Hello, {{placeholder}}';
      
      function escapeQuestion (text) {
        return text + '?';
      }
      Mustache.render(template, { placeholder: 'world' });
      assert.equal(Mustache.render(template, { placeholder: 'world' }, {}, { escape: escapeQuestion }), 'Hello, world?');
    });

    it('uses config.escape argument instead of Mustache.escape when given, even when it previously rendered the template using a different escape function', function () {
      var template = 'Hello, {{placeholder}}';
      
      function escapeQuestion (text) {
        return text + '?';
      }
      function escapeBang (text) {
        return text + '!';
      }
      Mustache.render(template, { placeholder: 'foo' }, {}, { escape: escapeQuestion });
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, { escape: escapeBang }), 'Hello, foo!');
    });
    
    it('does not mutate Mustache.escape when given config.escape argument', function () {
      var correctMustacheEscape = Mustache.escape;

      function escapeNone (text) {
        return text;
      }
      Mustache.render('((placeholder))', { placeholder: 'foo' }, {}, { escape: escapeNone });

      assert.equal(Mustache.escape, correctMustacheEscape);
      assert.equal(Mustache.escape('>&'), '&gt;&amp;');
    });
    
    it('uses provided config.escape when rendering partials', function () {
      function escapeDoubleAmpersand (text) {
        return text.replace('&', '&&');
      }
      var output = Mustache.render('{{> partial }}', { name: 'Ampersand &' }, {
        partial: '{{ name }}'
      }, { escape: escapeDoubleAmpersand }); 

      assert.equal(output, 'Ampersand &&');
    });
    
    it('uses config.tags and config.escape arguments instead of Mustache.tags and Mustache.escape when given', function () {
      var template = 'Hello, {{placeholder}} [[placeholder]]';
      
      function escapeTwoBangs (text) {
        return text + '!!';
      }
      var config = {
        tags: ['[[', ']]'],
        escape: escapeTwoBangs,
      };
      assert.equal(Mustache.render(template, { placeholder: 'world' }, {}, config), 'Hello, {{placeholder}} world!!');
    });
    
    it('uses provided config.tags and config.escape when rendering partials', function () {
      function escapeDoubleAmpersand (text) {
        return text.replace('&', '&&');
      }
      var config = {
        tags: ['[[', ']]'],
        escape: escapeDoubleAmpersand
      };
      var output = Mustache.render('[[> partial ]]', { name: 'Ampersand &' }, {
        partial: '[[ name ]]'
      }, config); 

      assert.equal(output, 'Ampersand &&');
    });
    
    it('uses provided config.tags and config.escape when rendering sections', function () {
      var template = (
        '<[[&value-raw]]: ' +
        '[[#test-1]][[value-1]][[/test-1]]' +
        '[[^test-2]][[value-2]][[/test-2]], ' +
        '[[#test-lambda]][[value-lambda]][[/test-lambda]]' +
        '>'
      );
      
      function escapeQuotes (text) {
        return '"' + text + '"';
      }
      var config = {
        tags: ['[[', ']]'],
        escape: escapeQuotes
      };
      var viewTestTrue = {
        'value-raw': 'foo',
        'test-1': true,
        'value-1': 'abc',
        'test-2': true,
        'value-2': '123',
        'test-lambda': function () {
          return function (text, render) { return 'lambda: ' + render(text); };
        },
        'value-lambda': 'bar'
      };
      var viewTestFalse = {
        'value-raw': 'foo',
        'test-1': false,
        'value-1': 'abc',
        'test-2': false,
        'value-2': '123',
        'test-lambda': function () {
          return function (text, render) { return 'lambda: ' + render(text); };
        },
        'value-lambda': 'bar'
      };
      var outputTrue = Mustache.render(template, viewTestTrue, {}, config); 
      var outputFalse = Mustache.render(template, viewTestFalse, {}, config); 

      assert.equal(outputTrue, '<foo: "abc", lambda: "bar">');
      assert.equal(outputFalse, '<foo: "123", lambda: "bar">');
    });
  });

  tests.forEach(function (test) {
    var view = eval(test.view);

    it('knows how to render ' + test.name, function () {
      var output;
      if (test.partial) {
        output = Mustache.render(test.template, view, { partial: test.partial });
      } else {
        output = Mustache.render(test.template, view);
      }

      output.should.equal(test.expect);
    });

  });
});
