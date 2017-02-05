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
        // Ensure partials can be retreived via an object or a function
        // See Writer.prototype.renderPartial
        var partial = test.name === 'partial_function'
          ? function (partial, context) { return test.partial }
          : { partial: test.partial };

        output = Mustache.render(test.template, view, partial);
      } else {
        output = Mustache.render(test.template, view);
      }

      output.should.equal(test.expect);
    });

  });
});
