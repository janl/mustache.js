var assert = require("assert");
var vows = require("vows");
var Writer = require("./../mustache").Writer;

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
    }
  }
}).export(module);
