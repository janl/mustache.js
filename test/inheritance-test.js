require('./helper');

describe('Template inheritance', function () {
  beforeEach(function () {
    Mustache.clearCache();
  });

  it('resolves parents through a partials function', function () {
    var template = '{{<layout}}{{$title}}Some title{{/title}}{{/layout}}';
    var data = {};
    var partials = function (name) {
      return name === 'layout' ? '[{{$title}}Default title{{/title}}]' : undefined;
    };
    var expected = '[Some title]';
    var renderResult = Mustache.render(template, data, partials);
    assert.equal(renderResult, expected);
  });

  it('renders nothing for a parent missing from partials', function () {
    var template = '-{{<missing}}{{$block}}ignored{{/block}}{{/missing}}-';
    var data = {};
    var partials = {};
    var expected = '--';
    var renderResult = Mustache.render(template, data, partials);
    assert.equal(renderResult, expected);
  });

  it('supports custom delimiters at the call site', function () {
    var tags = ['[[', ']]'];
    var template = '[[<parent]][[$bit]]overridden[[/bit]][[/parent]]';
    var data = { value: 'world' };
    var partials = { parent: '([[$bit]]default[[/bit]] [[value]])' };
    var expected = '(overridden world)';
    var renderResult = Mustache.render(template, data, partials, tags);
    assert.equal(renderResult, expected);
  });

  it('renders the same cached parent with different overrides', function () {
    var data = {};
    var partials = { parent: '[{{$block}}default{{/block}}]' };
    var first = Mustache.render('{{<parent}}{{$block}}one{{/block}}{{/parent}}', data, partials);
    var second = Mustache.render('{{<parent}}{{$block}}two{{/block}}{{/parent}}', data, partials);
    assert.equal(first, '[one]');
    assert.equal(second, '[two]');
  });

  it('gives a higher-order section inside an override its own literal text', function () {
    var template = '{{<parent}}{{$block}}{{#wrap}}from the child template{{/wrap}}{{/block}}{{/parent}}';
    var data = {
      wrap: function () {
        return function (text) {
          return '(' + text + ')';
        };
      }
    };
    var partials = { parent: '{{$block}}default{{/block}}' };
    var expected = '(from the child template)';
    var renderResult = Mustache.render(template, data, partials);
    assert.equal(renderResult, expected);
  });

  it('does not let overrides reach templates rendered through subRender', function () {
    var template = '{{<parent}}{{$block}}override{{/block}}{{/parent}}';
    var data = {
      lambda: function () {
        return function (text, render) {
          return render('{{$block}}default via subRender{{/block}}');
        };
      }
    };
    var partials = { parent: '{{#lambda}}ignored{{/lambda}}' };
    var expected = 'default via subRender';
    var renderResult = Mustache.render(template, data, partials);
    assert.equal(renderResult, expected);
  });

  it('propagates overrides through an ordinary partial call', function () {
    var template = '{{<parent}}{{$block}}override{{/block}}{{/parent}}';
    var data = {};
    var partials = { parent: '{{>intermediate}}', intermediate: '{{$block}}default{{/block}}' };
    var expected = 'override';
    var renderResult = Mustache.render(template, data, partials);
    assert.equal(renderResult, expected);
  });

  it('throws a section error for an unclosed parent or block tag', function () {
    assert.throws(function () {
      Mustache.parse('before {{<parent}}');
    }, /unclosed section "parent" at 18/i);
    assert.throws(function () {
      Mustache.parse('before {{$block}}');
    }, /unclosed section "block" at 17/i);
  });
});
