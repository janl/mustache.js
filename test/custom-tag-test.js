require('./helper');

describe('Add custom tag function', function () {
  describe('for an non-alphabetic tag string', function () {
    it('throws an error', function () {
      assert.throws(function() {
        Mustache.addCustomTag('tag?', function () {});
      }, 'invalid tag name');
      assert.throws(function() {
        Mustache.addCustomTag('0tag', function () {});
      }, 'invalid tag name');
    })
  });

  describe('for an illegal function argument', function () {
    it('throws an error', function () {
      assert.throws(function() {
        Mustache.addCustomTag('tag');
      }, 'invalid callback');
    })
  });

  describe('callback', function () {
    it('must receive contents of a tag', function() {
      Mustache.addCustomTag('tag', function (contents, value) {
        assert.equal(contents, 'some text');
      });

      Mustache.render('here is {{tag some text}}');
    });

    it('must receive a variable if it exists', function() {
      Mustache.addCustomTag('tag', function (contents, value) {
        assert.equal(value[1], 2);
      });

      Mustache.render('here is {{tag v}}', {v: [1,2,3]});
    });
  });

  describe('for an alphababetic tag name and a valid callback', function () {
    it('adds a new tag', function () {
      Mustache.addCustomTag('dummy', function () {
        return 'Lorem ipsum dolor sit amet, consectetur adipisicing elit';
      });
      var text = Mustache.render('some dummy text: {{dummy}}');
      assert.equal(text, 'some dummy text: Lorem ipsum dolor sit amet, consectetur adipisicing elit');
    });

    describe('if tag exists', function () {
      it('updates a callback', function () {
        Mustache.addCustomTag('dummy', function () {
          return 'Lorem ipsum dolor sit amet, consectetur adipisicing elit';
        });
        Mustache.addCustomTag('dummy', function () {
          return 'updated';
        });
        var text = Mustache.render('some dummy text: {{dummy}}');
        assert.equal(text, 'some dummy text: updated');
      });
    });

    describe('if callback does not return a string', function () {
      it('ignores the tag', function () {
        Mustache.addCustomTag('tag', function () {
          return {};
        });
        var text = Mustache.render('some {{tag}} text');
        assert.equal(text, 'some  text');
      });
    });

    describe('every tag', function () {
      it('must have it\'s own callback', function() {
        Mustache.addCustomTag('som', function () {
          return "this won\'t be displayed";
        });
        Mustache.addCustomTag('some', function () {
          return "ok";
        });
        var text = Mustache.render('some {{some}} text');
        assert.equal(text, 'some ok text');
      });
    });
  });
});