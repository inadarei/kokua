const test = require('ava');
const kokua = require ('../../lib/kokua');

// test('foo', t => {
//  t.pass();
// });

test('mt() function', t => {
  const mediatypes = {
    "hal" : "application/hal+json",
    "siren" : "application/vnd.siren+json",
    "coljson" : "application/vnd.collection+json",
    "uber" : "application/vnd.uber+json"
  };

  for (const prop in mediatypes) {
    if (mediatypes.hasOwnProperty(prop)) {
      t.is(kokua.mt(prop), mediatypes[prop]);
    }
  }

  t.is(kokua.mt('non-existent-prop'), null);
});

test('isSupportedMediaType()', t => {
  t.is(kokua.isSupportedMediaType('application/hal+json'), true);
  t.is(kokua.isSupportedMediaType('uber'), false);
});

test('constructor throws an error for unsupported media types', t => {

  const error = t.throws(() => {
    kokua({}, 'non-existent-media-type');
  }, Error);

  t.is(error.message, 'Kokua representor doesn\'t yet support \'non-existent-media-type\' media type.');
});

test('constructor accepts strings and objects. Tanslates to basic HAL', t => {
  const testHyper = {
    "body": {
      "department": "North-East",
      "budget": "500M USD"
    }
  };

  const shouldHAL = {
    "department": "North-East",
    "budget": "500M USD"
  };

  const actualHAL = kokua(JSON.stringify(testHyper), kokua.mt('hal'));
  t.deepEqual(actualHAL, shouldHAL);
});
