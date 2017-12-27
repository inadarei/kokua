const test        = require('ava');
const log         = require('metalogger')();
const kokua       = require ('../../lib/kokua');
const loadFixture = require('../helpers/fixture-helper').loadFixture;

let halDoc, hyperDoc;

test.before(async t => {
  // This runs before all tests
  halDoc = await loadFixture('hal.json');
  halDoc = JSON.parse(halDoc);
  // Note: loaded fixtures are string, not objects, but Kokua can handle it
  hyperDoc = await loadFixture('hal-hyper.json');
});

test.skip('Full test', async t => {
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));
  t.deepEqual(halDoc, halDocTranslated);
});

test('Curries', async t => {
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));
  t.deepEqual(halDoc._links.curies, halDocTranslated._links.curies);
});
