require('./helper');

var renderHelper = require('./render-helper');

var tests = renderHelper.getTests();

describe('Mustache.sanitizeUnescaped', function () {
  beforeEach(function () {
    Mustache.setUnescapedSanitizier(function(value) {
      return value.toUpperCase();
    });
  });

  it('requires template to be a string', function () {
    assert.equal(Mustache.render('{{{value}}}', {value: '<b>abc</b>'}),
        '<B>ABC</B>');
  });
});
