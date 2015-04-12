require('./helper');

var renderHelper = require('./render-helper');

var tests = renderHelper.getTests();

describe('Mustache.render', function () {
  beforeEach(function () {
    Mustache.clearCache();
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

      assert.equal(output, test.expect);
    });

  });
});
