/**
 * Tests that verify accurace of Siren -> Hyper conversion
 */

//const test          = require('tap').test;

const test          = require('blue-tape');
const log           = require('metalogger')(); // eslint-disable-line no-unused-vars
const kokua         = require ('../../lib/kokua');
const sirenTranslator = require('../../lib/plugins/siren-reverse');
const loadFixture   = require('../helpers/fixture-helper').loadFixture;

let sirenWurlDoc, hyperDoc, sirenStdDoc, hyperStdDoc;

async function setup() {
  // src: http://developers.wurl.com/pages/guides/search
  sirenWurlDoc = await loadFixture('siren-wurl.json');
  sirenWurlDoc = JSON.parse(sirenWurlDoc);

  // Note: loaded fixtures are string, not objects, but Kokua can handle it
  hyperDoc = await loadFixture('siren-wurl-hyper.json');
  hyperDoc = JSON.parse(hyperDoc);

  // src: http://developers.wurl.com/pages/guides/search
  sirenStdDoc = await loadFixture('siren-standard.json');
  sirenStdDoc = JSON.parse(sirenStdDoc);

  hyperStdDoc = await loadFixture('siren-standard-hyper.json');
  hyperStdDoc = JSON.parse(hyperStdDoc);
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

test('Siren to Hyper: Actions', async t => {
  await setup();

  const st = sirenTranslator(sirenWurlDoc);
  st.processActions();
  const docTranslated = st.newDoc;

  const expected = {"h:link": [
    {
      "template": {
        "contentType": "application/x-www-form-urlencoded",
        "fields": {
          "orderNumber": {"type": "hidden", "default": "42"},
          "productCode": {"type": "text"},
          "quantity": {"type": "number", "label": "Quantity"}
        }
      },
      "uri": "http://api.x.io/orders/42/items",
      "label": "Add Item",
      "action": "append"
    }
  ]};
  t.same(docTranslated, expected, "Converted properly");
});


test('Siren to Hyper: Process Entities', async t => {
  await setup();

  const st = sirenTranslator(sirenWurlDoc);
  st.processEntities();
  const docTranslated = st.newDoc;

  const expected = hyperDoc.entities;

  t.same(docTranslated.entities, expected, "Converted properly");
});

test('Siren to Hyper: Full Tests', async t => {
  await setup();
  const docTranslated = kokua.parse(sirenWurlDoc, kokua.mt('siren'));

  t.same(docTranslated, hyperDoc, "WURL Sample Converted properly");

  const docTranslated2 = kokua.parse(sirenStdDoc, kokua.mt('siren'));
  t.same(docTranslated2, hyperStdDoc, "Standard Sample Converted properly");
});

test('Siren to Hyper: object validation', t => {
  const sirenDoc = {"name" : "some object", links : []};
  const st = sirenTranslator(JSON.stringify(sirenDoc));
  t.same(st.doc.name, "some object", "Constructor parses strings to objects");

  const sirenDoc2 = {"class" : "broken"};
  t.throws(() => {
    kokua.parse(sirenDoc2, kokua.mt('siren'));
  }, /In Siren messages 'class' must be an array.*/,
  "In Siren messages 'class' must be an array");

  const sirenDoc3 = {"links" : "broken"};
  t.throws(() => {
    kokua.parse(sirenDoc3, kokua.mt('siren'));
  }, /In Siren messages 'links' must be an array.*/,
  "In Siren messages 'links' must be an array");

  t.end();
});
