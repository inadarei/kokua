const test        = require('ava');
const log         = require('metalogger')();
const kokua       = require ('../../lib/kokua');
const loadFixture = require('../helpers/fixture-helper').loadFixture;

test.skip('foo', async t => {

  let halDoc = await loadFixture('hal.json');
  halDoc = JSON.parse(halDoc);

  // Note: loaded fixtures are string, not objects, but Kokua can handle it
  const hyperDoc = await loadFixture('hal-hyper.json');
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));

  t.deepEqual(halDoc, halDocTranslated);
});
