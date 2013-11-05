require('./helper');
var Context = Mustache.Context;

describe('A new Mustache.Context', function () {
  var context;
  beforeEach(function () {
    context = new Context({ name: 'parent', message: 'hi', a: { b: 'b' } });
  });

  it('is able to lookup properties of its own view', function () {
    assert.equal(context.lookup('name'), 'parent');
  });

  it('is able to lookup nested properties of its own view', function () {
    assert.equal(context.lookup('a.b'), 'b');
  });

  describe('when pushed', function () {
    beforeEach(function () {
      context = context.push({ name: 'child', c: { d: 'd' } });
    });

    it('returns the child context', function () {
      assert.equal(context.view.name, 'child');
      assert.equal(context.parent.view.name, 'parent');
    });

    it('is able to lookup properties of its own view', function () {
      assert.equal(context.lookup('name'), 'child');
    });

    it("is able to lookup properties of the parent context's view", function () {
      assert.equal(context.lookup('message'), 'hi');
    });

    it('is able to lookup nested properties of its own view', function () {
      assert.equal(context.lookup('c.d'), 'd');
    });

    it('is able to lookup nested properties of its parent view', function () {
      assert.equal(context.lookup('a.b'), 'b');
    });
  });
});

describe('A Mustache.Context', function () {
  var context;

  describe('with an empty string in the lookup chain', function () {
    var view, context;
    beforeEach(function () {
      view = { a: '' };
      view.a.b = 'value';
      context = new Context(view);
    });

    it('is able to lookup a nested property', function () {
      assert.equal(context.lookup('a.b'), view.a.b);
    });
  });
});

describe('Mustache.Context.make', function () {
  it('returns the same object when given a Context', function () {
    var context = new Context;
    assert.strictEqual(Context.make(context), context);
  });
});
