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

test('Hyper to Hal: Broken Currie Test', t=> {
  const brokenHyper = { // h:link must be an array
    "h:head" : {
      "curies" : "this is a broken currie",
    },
    "something" : 23, "other" : "lorem"
  };
  const expectedError = /.*?curies must be an object, instead received:.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper);
    representor.translate();
  }, expectedError, "Invalid CURIE should throw an error");
  t.end();
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

test('Hyper to HAL: h:ref must be an object', t=> {
  const brokenHyper = { // h:link must have a rel property
    "something" : 23, "other" : "lorem",
    "h:ref" : ["broken"]
  };
  const expectedError = /h:ref must be a JSON object, instead received.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper);
    representor.translate();
  }, expectedError, "Accidentally indicating non-object h:ref should throw an error");

  const brokenHyper2 = { // h:link must have a rel property
    "something" : 23, "other" : "lorem",
    "lorem" : { "h:ref" : ["broken"]}
  };
  const expectedError2 = /h:ref must be a JSON object, instead received.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper2);
    representor.translate();
  }, expectedError2, "Accidentally indicating non-object h:ref should throw an error");

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

test('Hyper to HAL: h:link must be an array', t=> {
  const brokenHyper = { // h:link must have a rel property
    "something" : 23, "other" : "lorem",
    "lorem" : { "h:link" : {}}
  };
  const expectedError = /h:link must be an array, instead received.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper);
    representor.translate();
  }, expectedError, "Accidentally indicating non-array h:link should throw an error");

  const brokenHyper2 = { // h:link must have a rel property
    "something" : 23, "other" : "lorem",
    "h:link" : {}
  };
  const expectedError2 = /h:link must be an array, instead received.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper2);
    representor.translate();
  }, expectedError2, "Accidentally indicating non-array, top-level h:link should throw an error");

  t.end();
});

test('Hyper to HAL: h:link must have a rel property', t=> {
  const brokenHyper = { // h:link must have a rel property
    "h:link" : [{ "uri" : "http://example.com/api", "label" : "selfie" }],
    "something" : 23, "other" : "lorem"
  };
  const expectedError = /A rel property is required on any h:link.*/;
  t.throws( () => {
    const representor = halTranslator(brokenHyper);
    representor.translate();
  }, expectedError, "Accidentally indicating h:link without a rel should throw an error");

  t.end();
});
