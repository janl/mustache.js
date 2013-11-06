require('./helper');
var Writer = Mustache.Writer;

describe('A new Mustache.Writer', function () {
  var writer;

  describe('with a cached partial', function () {
    beforeEach(function () {
      writer = new Writer;
    });

    it('caches partials by content, not name', function () {
      writer.cachePartial('partial', 'partial one');
      assert.equal(writer.render('{{>partial}}'), 'partial one');

      writer.cachePartial('partial', 'partial two');
      assert.equal(writer.render('{{>partial}}'), 'partial two');
    });
  });

  describe('with a partial loader', function () {
    var partial;
    beforeEach(function () {
      partial = 'The content of the partial.';
      writer = new Writer(function (name) {
        assert.equal(name, 'partial');
        return partial;
      });
    });

    it('loads partials correctly', function () {
      assert.equal(writer.render('{{>partial}}'), partial);
    });
  });

});
