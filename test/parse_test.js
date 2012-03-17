var assert = require("assert"),
    vows = require("vows"),
    parse = require("./../mustache").parse;

// A map of templates to their expected token output.
var expectations = {
  "{{hi}}"                                  : [ { type: 'name', value: 'hi' } ],
  "{{hi.world}}"                            : [ { type: 'name', value: 'hi.world' } ],
  "{{hi . world}}"                          : [ { type: 'name', value: 'hi . world' } ],
  "{{ hi}}"                                 : [ { type: 'name', value: 'hi' } ],
  "{{hi }}"                                 : [ { type: 'name', value: 'hi' } ],
  "{{ hi }}"                                : [ { type: 'name', value: 'hi' } ],
  "{{{hi}}}"                                : [ { type: '{', value: 'hi' } ],
  "{{!hi}}"                                 : [ { type: '!', value: 'hi' } ],
  "{{! hi}}"                                : [ { type: '!', value: 'hi' } ],
  "{{! hi }}"                               : [ { type: '!', value: 'hi' } ],
  "{{ !hi}}"                                : [ { type: '!', value: 'hi' } ],
  "{{ ! hi}}"                               : [ { type: '!', value: 'hi' } ],
  "{{ ! hi }}"                              : [ { type: '!', value: 'hi' } ],
  "a{{hi}}"                                 : [ { type: 'text', value: 'a' }, { type: 'name', value: 'hi' } ],
  "a {{hi}}"                                : [ { type: 'text', value: 'a ' }, { type: 'name', value: 'hi' } ],
  " a{{hi}}"                                : [ { type: 'text', value: ' a' }, { type: 'name', value: 'hi' } ],
  " a {{hi}}"                               : [ { type: 'text', value: ' a ' }, { type: 'name', value: 'hi' } ],
  "a{{hi}}b"                                : [ { type: 'text', value: 'a' }, { type: 'name', value: 'hi' }, { type: 'text', value: 'b' } ],
  "a{{hi}} b"                               : [ { type: 'text', value: 'a' }, { type: 'name', value: 'hi' }, { type: 'text', value: ' b' } ],
  "a{{hi}}b "                               : [ { type: 'text', value: 'a' }, { type: 'name', value: 'hi' }, { type: 'text', value: 'b ' } ],
  "a\n{{hi}} b \n"                          : [ { type: 'text', value: 'a\n' }, { type: 'name', value: 'hi' }, { type: 'text', value: ' b \n' } ],
  "a\n {{hi}} \nb"                          : [ { type: 'text', value: 'a\n ' }, { type: 'name', value: 'hi' }, { type: 'text', value: ' \nb' } ],
  "a\n {{!hi}} \nb"                         : [ { type: 'text', value: 'a\n' }, { type: '!', value: 'hi' }, { type: 'text', value: 'b' } ],
  "a\n{{#a}}{{/a}}\nb"                      : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}{{/a}}\nb"                     : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}{{/a}} \nb"                    : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n{{#a}}\n{{/a}}\nb"                    : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}\n{{/a}}\nb"                   : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}\n{{/a}} \nb"                  : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n{{#a}}\n{{/a}}\n{{#b}}\n{{/b}}\nb"    : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: '#', value: 'b', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}\n{{/a}}\n{{#b}}\n{{/b}}\nb"   : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: '#', value: 'b', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}\n{{/a}}\n{{#b}}\n{{/b}} \nb"  : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [] }, { type: '#', value: 'b', tokens: [] }, { type: 'text', value: 'b' } ],
  "a\n{{#a}}\n{{#b}}\n{{/b}}\n{{/a}}\nb"    : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [ { type: '#', value: 'b', tokens: [] } ] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}\n{{#b}}\n{{/b}}\n{{/a}}\nb"   : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [ { type: '#', value: 'b', tokens: [] } ] }, { type: 'text', value: 'b' } ],
  "a\n {{#a}}\n{{#b}}\n{{/b}}\n{{/a}} \nb"  : [ { type: 'text', value: 'a\n' }, { type: '#', value: 'a', tokens: [ { type: '#', value: 'b', tokens: [] } ] }, { type: 'text', value: 'b' } ],
  "{{>abc}}"                                : [ { type: '>', value: 'abc' } ],
  "{{> abc }}"                              : [ { type: '>', value: 'abc' } ],
  "{{ > abc }}"                             : [ { type: '>', value: 'abc' } ],
  "{{=<% %>=}}"                             : [ { type: '=', value: '<% %>' } ],
  "{{= <% %> =}}"                           : [ { type: '=', value: '<% %>' } ],
  "{{=<% %>=}}<%={{ }}=%>"                  : [ { type: '=', value: '<% %>' }, { type: '=', value: '{{ }}' } ],
  "{{=<% %>=}}<%hi%>"                       : [ { type: '=', value: '<% %>' }, { type: 'name', value: 'hi' } ],
  "{{#a}}{{/a}}hi{{#b}}{{/b}}\n"            : [ { type: '#', value: 'a', tokens: [] }, { type: 'text', value: 'hi' }, { type: '#', value: 'b', tokens: [] }, { type: 'text', value: '\n' } ],
  "{{a}}\n{{b}}\n\n{{#c}}\n{{/c}}\n"        : [ { type: 'name', value: 'a' }, { type: 'text', value: '\n' }, { type: 'name', value: 'b' }, { type: 'text', value: '\n\n' }, { type: '#', value: 'c', tokens: [] } ],
  "{{#foo}}\n  {{#a}}\n    {{b}}\n  {{/a}}\n{{/foo}}\n"
                                            : [ { type: "#", value: "foo", tokens: [ { type: "#", value: "a", tokens: [ { type: "text", value: "    " }, { type: "name", value: "b" }, { type: "text", value: "\n" } ] } ] } ]
};

var spec = {};

for (var template in expectations) {
  (function (template, tokens) {
    spec["knows how to parse " + JSON.stringify(template)] = function () {
      assert.deepEqual(parse(template), tokens);
    };
  })(template, expectations[template]);
}

vows.describe("Mustache.parse").addBatch({
  "parse": spec
}).export(module);
