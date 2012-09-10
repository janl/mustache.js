var assert = require("assert");
var vows = require("vows");
var Scanner = require("./../mustache").Scanner;

vows.describe("Mustache.Scanner").addBatch({
  "A Scanner": {
    "for an empty string": {
      topic: new Scanner(""),
      "is at the end of the string": function () {
        var scanner = new Scanner("");
        assert(scanner.eos());
      }
    },
    "for a non-empty string": {
      topic: "a b c",
      "when calling scan": {
        "when the regexp matches the entire string": {
          topic: function (string) {
            var scanner = new Scanner(string);
            var match = scanner.scan(/a b c/);
            this.callback(scanner, match);
          },
          "returns the entire string": function (scanner, match) {
            assert.equal(match, scanner.string);
          },
          "is at the end of the string": function (scanner, match) {
            assert(scanner.eos());
          }
        }, // when the regexp matches the entire string
        "when the regexp matches": {
          "at the 0th index": {
            topic: function (string) {
              var scanner = new Scanner(string);
              var match = scanner.scan(/a/);
              this.callback(scanner, match);
            },
            "returns the portion of the string that was matched": function (scanner, match) {
              assert.equal(match, "a");
            },
            "advances the internal pointer the length of the match": function (scanner, match) {
              assert.equal(scanner.pos, 1);
            }
          }, // at the 0th index
          "at some index other than 0": {
            topic: function (string) {
              var scanner = new Scanner(string);
              var match = scanner.scan(/b/);
              this.callback(scanner, match);
            },
            "returns the empty string": function (scanner, match) {
              assert.equal(match, "");
            },
            "does not advance the internal pointer": function (scanner, match) {
              assert.equal(scanner.pos, 0);
            }
          } // at some index other than 0
        }, // when the regexp matches
        "when the regexp doesn't match": {
          topic: function (string) {
            var scanner = new Scanner(string);
            var match = scanner.scan(/z/);
            this.callback(scanner, match);
          },
          "returns the empty string": function (scanner, match) {
            assert.equal(match, "");
          },
          "does not advance the internal pointer": function (scanner, match) {
            assert.equal(scanner.pos, 0);
          }
        }
      }, // when calling scan
      "when calling scanUntil": {
        "when the regexp matches": {
          "at the 0th index": {
            topic: function (string) {
              var scanner = new Scanner(string);
              var match = scanner.scanUntil(/a/);
              this.callback(scanner, match);
            },
            "returns the empty string": function (scanner, match) {
              assert.equal(match, "")
            },
            "does not advance the internal pointer": function (scanner, match) {
              assert.equal(scanner.pos, 0);
            }
          },
          "at index 2": {
            topic: function (string) {
              var scanner = new Scanner(string);
              var match = scanner.scanUntil(/b/);
              this.callback(scanner, match);
            },
            "returns the portion of the string it scanned": function (scanner, match) {
              assert.equal(match, "a ");
            },
            "advances the internal pointer the length of the match": function (scanner, match) {
              assert.equal(scanner.pos, 2);
            }
          }
        }, // when the regexp matches
        "when the regexp doesn't match": {
          topic: function (string) {
            var scanner = new Scanner(string);
            var match = scanner.scanUntil(/z/);
            this.callback(scanner, match);
          },
          "returns the entire string": function (scanner, match) {
            assert.equal(match, scanner.string);
          },
          "is at the end of the string": function (scanner, match) {
            assert(scanner.eos());
          }
        } // when the regexp doesn't match
      } // when calling scanUntil
    } // for a non-empty string
  }
}).export(module);
