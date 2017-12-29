const test          = require('blue-tape');
const log           = require('metalogger')();
const kokua         = require ('../../lib/kokua');
const sirenTranslator = require('../../lib/plugins/siren');
const _             = require('lodash');
const loadFixture   = require('../helpers/fixture-helper').loadFixture;

let sirenDoc, hyperDoc;

async function setup() {
  sirenDoc = await loadFixture('siren.json');
  sirenDoc = JSON.parse(sirenDoc);
  // Note: loaded fixtures are string, not objects, but Kokua can handle it
  hyperDoc = await loadFixture('siren-hyper.json');
}

test('Hyper to Siren: Top-Level Properties', async t => {
  await setup();

  const st = sirenTranslator(hyperDoc);
  st.processProperties();
  const docTranslated = st.newDoc;

  const expected = {
    "properties": {
      "orderNumber": 42, "itemCount": 3, "status": "pending"
    }, "class": [ "siren-types:order" ]
  };
  t.same(docTranslated, expected, "Converted properly");
});

test('Hyper to Siren: Top-Level H:Refs', async t => {
  await setup();
  const docTranslated = kokua(hyperDoc, kokua.mt('siren'));

  const expected = [
    {"rel": ["self"], "href": "http://api.x.io/orders/42"},
    {"rel": ["previous"], "href": "http://api.x.io/orders/41"},
    {"rel": ["next"], "href": "http://api.x.io/orders/43"}
  ];
  t.same(docTranslated.links, expected, "Converted properly");
});

test('Hyper to Siren: Top-Level Links', async t => {
  await setup();
  const docTranslated = kokua(hyperDoc, kokua.mt('siren'));

  const expected = [
    {
      "name": "add-item",
      "title": "Add Item",
      "method": "POST",
      "href": "http://api.x.io/orders/42/items",
      "type": "application/x-www-form-urlencoded",
      "fields": [
        {"name": "orderNumber", "type": "hidden", "value": "42"},
        {"name": "productCode", "type": "text"},
        {"name": "quantity", "type": "number"}
      ]
    }
  ];
  t.same(docTranslated.actions, expected, "Converted properly");
});

test.skip('Hyper to Siren: Process Entities', async t => {
  await setup();

  const st = sirenTranslator(hyperDoc);
  st.processEntities();
  const docTranslated = st.newDoc;

  log.info("tr", docTranslated);

  //const expected = {"orderNumber": 42, "itemCount": 3, "status": "pending"};
  //t.same(docTranslated, expected, "Converted properly");
});
