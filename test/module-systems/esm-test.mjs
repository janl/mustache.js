import assert from 'assert';
import mustache from 'mustache/mustache.mjs';

const view = {
  title: 'Joe',
  calc: () => 2 + 4
};

assert.strictEqual(
  mustache.render('{{title}} spends {{calc}}', view),
  'Joe spends 6'
);
