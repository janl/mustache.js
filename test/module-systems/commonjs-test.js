const assert = require('assert');
const mustache = require('mustache');

const view = {
  title: 'Joe',
  calc: () => 2 + 4
};

assert.strictEqual(
  mustache.render('{{title}} spends {{calc}}', view),
  'Joe spends 6'
);
