var assert = require("assert");
var vows = require("vows");
var Mustache = require("./../mustache");
var Writer = Mustache.Writer;

vows.describe("Mustache.Writer").addBatch({
  "A Writer": {
    topic: function () {
      var writer = new Writer();
      return writer;
    },
    "loads partials correctly": function (writer) {
      var partial = "The content of the partial.";
      var result = writer.render("{{>partial}}", {}, function (name) {
        assert.equal(name, "partial");
        return partial;
      });

      assert.equal(result, partial);
    },
    "caches partials by content, not by name": function (writer) {
      var result = writer.render("{{>partial}}", {}, {
        partial: "partial one"
      });

      assert.equal(result, "partial one");

      result = writer.render("{{>partial}}", {}, {
        partial: "partial two"
      });

      assert.equal(result, "partial two");
    },
    "can compile an array of tokens": function (writer) {
      var template = "Hello {{name}}!";
      var tokens = Mustache.parse(template);
      var render = writer.compileTokens(tokens, template);

      var result = render({ name: 'Michael' });

      assert.equal(result, 'Hello Michael!');
    }
  }
}).export(module);
