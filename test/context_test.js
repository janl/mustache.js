var assert = require("assert");
var vows = require("vows");
var Context = require("./../mustache").Context;

vows.describe("Mustache.Context").addBatch({
  "A Context": {
    topic: function () {
      var view = { name: 'parent', message: 'hi', a: { b: 'b' } };
      var context = new Context(view);
      return context;
    },
    "is able to lookup properties of its own view": function (context) {
      assert.equal(context.lookup("name"), "parent");
    },
    "is able to lookup nested properties of its own view": function (context) {
      assert.equal(context.lookup("a.b"), "b");
    },
    "when pushed": {
      topic: function (context) {
        var view = { name: 'child', c: { d: 'd' } };
        return context.push(view);
      },
      "returns the child context": function (context) {
        assert.equal(context.view.name, "child");
        assert.equal(context.parent.view.name, "parent");
      },
      "is able to lookup properties of its own view": function (context) {
        assert.equal(context.lookup("name"), "child");
      },
      "is able to lookup properties of the parent context's view": function (context) {
        assert.equal(context.lookup("message"), "hi");
      },
      "is able to lookup nested properties of its own view": function (context) {
        assert.equal(context.lookup("c.d"), "d");
      },
      "is able to lookup nested properties of its parent view": function (context) {
        assert.equal(context.lookup("a.b"), "b");
      }
    } // when pushed
  }, // A Context
  "make": {
    "returns the same object when given a Context": function () {
      var context = new Context;
      assert.strictEqual(Context.make(context), context);
    }
  }
}).export(module);
