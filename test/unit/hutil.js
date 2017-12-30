const test = require('blue-tape');
const kokua = require ('../../lib/kokua');
const hutil = require ('../../lib/hutil');

test('hutil.actionToHTTP()', (t) => {
  const expectedErr = /Unknown Hyper action/;
  t.throws(() => {
    hutil.actionToHTTP("non-existent");
  }, expectedErr, 'Trying to convert uknown action to an HTTP Method errors-out');

  const method = hutil.actionToHTTP("append");
  t.same(method, "POST", "Valid action properly converts to an HTTP Method");

  t.end();
});

test('hutil.verifyPrefix()', (t) => {
  const doc = {
    "h:head": {
      "curies": {
        "siren-types": "https://github.com/kevinswiber/siren?fake-type="
      }
    },
    "something" : "foo"
  };
  const is = hutil.verifyPrefix("siren-types", doc);
  t.same(is , true, "positive match test");

  const is2 = hutil.verifyPrefix("nonprefix", doc);
  t.same(is2 , false, "negative match test");

  doc["h:pvt"] = {};
  doc["h:pvt"].globalCuries = {"newp" : "http://example.com"};
  const is3 = hutil.verifyPrefix("newp", doc);
  t.same(is3 , true, "global curies match");

  t.end();
});

test('hutil.removePrefixIfCURIE()', (t) => {
  const doc = {
    "h:head": {
      "curies": {
        "siren-types": "https://github.com/kevinswiber/siren?fake-type="
      }
    },
    "something" : "foo"
  };
  const prefix = hutil.removePrefixIfCURIE("siren-types:lorem", doc);
  t.same(prefix ,"lorem", "positive match test");

  const prefix2 = hutil.removePrefixIfCURIE("nonprefix:lorem", doc);
  t.same(prefix2 ,"nonprefix:lorem", "negative match test");

  t.end();
});
