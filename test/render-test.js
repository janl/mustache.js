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

    it('uses tags argument instead of Mustache.tags when given, even when it previous rendered the template using Mustache.tags', function () {
      var template = '((placeholder))bar{{placeholder}}';

      Mustache.tags = ['{{', '}}'];
      Mustache.render(template, { placeholder: 'foo' });
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, ['((', '))']), 'foobar{{placeholder}}');
    });

    it('uses tags argument instead of Mustache.tags when given, even when it previous rendered the template using different tags', function () {
      var template = '[[placeholder]]bar<<placeholder>>';

      Mustache.render(template, { placeholder: 'foo' }, {}, ['<<', '>>']);
      assert.equal(Mustache.render(template, { placeholder: 'foo' }, {}, ['[[', ']]']), 'foobar<<placeholder>>');
    });

    it('does not mutate Mustache.tags when given tags argument', function() {
      var correctMustacheTags = ['{{', '}}'];
      Mustache.tags = correctMustacheTags;

      Mustache.render('((placeholder))', { placeholder: 'foo' }, {}, ['((', '))']);

      assert.equal(Mustache.tags, correctMustacheTags);
      assert.deepEqual(Mustache.tags, ['{{', '}}']);
    });

    it('uses provided tags when rendering partials', function () {
      var output = Mustache.render('<%> partial %>', { name: 'Santa Claus' }, {
        partial: '<% name %>'
      }, ['<%', '%>']);

      assert.equal(output, 'Santa Claus');
    })
  })

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
