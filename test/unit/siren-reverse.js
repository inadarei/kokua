/**
 * Tests that verify accurace of Siren -> Hyper conversion
 */
const test          = require('blue-tape');
const log           = require('metalogger')();
const kokua         = require ('../../lib/kokua');
const sirenTranslator = require('../../lib/plugins/siren-reverse');
const _             = require('lodash');
const loadFixture   = require('../helpers/fixture-helper').loadFixture;

let sirenWurlDoc, hyperDoc;

async function setup() {
  // src: http://developers.wurl.com/pages/guides/search
  sirenWurlDoc = await loadFixture('siren-wurl.json');
  sirenWurlDoc = JSON.parse(sirenWurlDoc);
  // Note: loaded fixtures are string, not objects, but Kokua can handle it
  hyperDoc = await loadFixture('siren-wurl-hyper.json');
}

test('Siren to Hyper: Top-Level Properties', async t => {
  await setup();

  const st = sirenTranslator(sirenWurlDoc);
  st.processProperties();
  const docTranslated = st.newDoc;

  const expected = {
    "searchTerms": "funny",
    "hits": 139,
    "start": 0,
    "h:type": ["search"],
    "h:label": "Example Siren from http://developers.wurl.com/pages/guides/search"
  };
  t.same(docTranslated, expected, "Properties, class and title converted properly");
});

test('Siren to Hyper: Links', async t => {
  await setup();

  const st = sirenTranslator(sirenWurlDoc);
  st.processLinks();
  const docTranslated = st.newDoc;

  const expected = {
    "h:ref": {
      "self": "https://api.wurl.com/api/search?q=funny",
      "next": "https://api.wurl.com/api/search?q=funny&start=10"
    },
    "h:link": [{"rel": ["added", "bykokua"], "uri": "http://example.com/foo"}]
  };
  t.same(docTranslated, expected, "Converted properly");
});

test.skip('Siren to Hyper: Process Entities', async t => {
  await setup();

  const st = sirenTranslator(hyperDoc);
  st.processEntities();
  const docTranslated = st.newDoc;

  const expected = sirenDoc.entities;

  t.same(docTranslated.entities, expected, "Converted properly");
});

test.skip('Siren to Hyper: Full Test', async t => {
  await setup();
  const docTranslated = kokua(hyperDoc, kokua.mt('siren'));

  t.same(docTranslated, sirenDoc, "Converted properly");
});
