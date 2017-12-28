const test = require('blue-tape');
const kokua = require ('../../lib/kokua');

test('mt() function', t => {
  const mediatypes = {
    "hal" : "application/hal+json",
    "siren" : "application/vnd.siren+json",
    "coljson" : "application/vnd.collection+json",
    "uber" : "application/vnd.uber+json"
  };

  for (const prop in mediatypes) {
    if (mediatypes.hasOwnProperty(prop)) {
      t.equal(kokua.mt(prop), mediatypes[prop]);
    }
  }

  t.equal(kokua.mt('non-existent-prop'), null);
  t.end();
});

test('isSupportedMediaType()', t => {
  t.equal(kokua.isSupportedMediaType('application/hal+json'), true);
  t.equal(kokua.isSupportedMediaType('uber'), false);
  t.end();
});

test('constructor throws an error for unsupported media types', t => {

  const expectedErr = /Kokua representor doesn't yet support 'non-existent-media-type' media type./;
  t.throws(() => {
    kokua({}, 'non-existent-media-type');
  }, expectedErr);

  t.end();
});

test('constructor accepts strings and objects. Tanslates to basic HAL', t => {
  const testHyper = {
    "h:head" : {
      "title" : "test departments"
    },
    "department": "North-East",
    "budget": "500M USD"
  };

  const shouldHAL = {
    "department": "North-East",
    "budget": "500M USD"
  };

  const actualHAL = kokua(JSON.stringify(testHyper), kokua.mt('hal'));
  t.deepEqual(actualHAL, shouldHAL);
  t.end();
});
