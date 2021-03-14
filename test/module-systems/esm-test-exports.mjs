import assert from 'assert';
import mustache from 'mustache';

const view = {
  title: 'Joe',
  calc: () => 2 + 4
};

assert.strictEqual(
  mustache.render('{{title}} spends {{calc}}', view),
  'Joe spends 6'
);
