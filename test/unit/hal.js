const test          = require('blue-tape');
const log           = require('metalogger')();
const kokua         = require ('../../lib/kokua');
const halTranslator = require('../../lib/plugins/hal');
const loadFixture   = require('../helpers/fixture-helper').loadFixture;

let halDoc, hyperDoc;

async function setup() {
  halDoc = await loadFixture('hal.json');
  halDoc = JSON.parse(halDoc);
  // Note: loaded fixtures are string, not objects, but Kokua can handle it
  hyperDoc = await loadFixture('hal-hyper.json');
}


test('Hyper to Hal: Full test', async t => {
  await setup();
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));
  // log.info("TRANSLATED : ", halDocTranslated);
  t.same(halDoc, halDocTranslated,
    "The translated and the test messages are equivalent");
});

test('Hyper to Hal: Curries', async t => {
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));
  t.deepEqual(halDoc._links.curies, halDocTranslated._links.curies,
    "Curries translated correctly.");

  const noCuriesHyper = {
    "h:head" : {
      "title" : "yeah"
    },
    "something": 23,
    "other" : "lorem"
  };
  const halDocTwo = kokua (noCuriesHyper, kokua.mt('hal'));
  delete noCuriesHyper["h:head"];
  t.deepEqual(halDocTwo, noCuriesHyper,
    "The case of not having curies handled gracefully");
});

test('Hyper to Hal: Top-Level H:refs', t => {
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));
  t.deepEqual(halDoc._links.next, halDocTranslated._links.next,
    "'next' translation is correct");
  t.deepEqual(halDoc._links.self, halDocTranslated._links.self,
    "'self' translation is correct");

  const noHrefsHyper = {
    "h:head" : {
      "title" : "yeah"
    },
    "something": 23,
    "other" : "lorem"
  };
  const halDocTwo = kokua (noHrefsHyper, kokua.mt('hal'));
  delete noHrefsHyper["h:head"];
  t.deepEqual(halDocTwo, noHrefsHyper,
    "The case of not having top-level hrefs handled gracefully");

  const simpleHyperWithHref = {
    "h:ref" : { "self" : "http://example.com/api" },
    "something" : 23, "other" : "lorem"
  };
  const simpleHalWithHref = {
    "_links" : {"self" : {"href" : "http://example.com/api"}},
    "something" : 23, "other" : "lorem"
  };

  const representor = halTranslator(simpleHyperWithHref);
  const translatedHal3 = representor.translate();
  t.same(translatedHal3, simpleHalWithHref,
    "Direct test of HAL plugin to verify top h:ref translation in the absense of other links");

  t.end();
});

test('Hyper to Hal: Top-Level H:link', t => {
  const halDocTranslated = kokua(hyperDoc, kokua.mt('hal'));
  t.deepEqual(halDoc._links, halDocTranslated._links);

  const brokenHyper = { // h:link must be an array
    "h:link" : { "rel" : ["self"], "uri" : "http://example.com/api", "label" : "selfie" },
    "something" : 23, "other" : "lorem"
  };
  const expectedError = /h:link must be an array, instead received.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper);
    representor.translate();
  }, expectedError, "Accidentally indicating h:link as an object instead of array should throw an error");

  const simpleHyperWithLink = {
    "h:link" : [{ "rel" : ["self"], "uri" : "http://example.com/api", "label" : "selfie" }],
    "something" : 23, "other" : "lorem"
  };
  const simpleHalWithLink = {
    "_links" : {"self" : {"href" : "http://example.com/api", "title" : "selfie"}},
    "something" : 23, "other" : "lorem"
  };
  const representor2 = halTranslator(simpleHyperWithLink);
  const translatedHal3 = representor2.translate();

  t.same(translatedHal3, simpleHalWithLink,
    "Direct test of HAL plugin to verify top h:link translation in the absense of other links");

  t.end();
});
