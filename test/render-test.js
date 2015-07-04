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
