const u =  {};

const _   = require("lodash");
const log = require("metalogger")(); // eslint-disable-line no-unused-vars

const linkActions = {
  "append" : "POST",
  "partial" : "PATCH",
  "read" : "GET",
  "remove" : "DELETE",
  "replace" : "PUT"
};
const httpMethods = _.invert(linkActions);

u.actionToHTTP = (action) => {
  if (!linkActions[action]) {
    throw new Error("Unknown Hyper action: " + action);
  }
  return linkActions[action];
};

u.httpToAction = (httpMethod) => {
  if (!httpMethods[httpMethod]) {
    throw new Error("Unsupported HTTP method: " + httpMethod);
  }
  return httpMethods[httpMethod];
};

/**
 * Make sure a CURIE prefix has been declared in h:head and is not just a
 * bogus string. For recursive documents we allow checking top-level curies
 * at any level, using the notion of "globalCuries".
 *
 * @param {*} doc
 * @param {*} prefix
 */
u.verifyPrefix  = (prefix, doc) => {
  let curies = _.at(doc, "h:head.curies");

  if (curies[0]) {
    curies = curies[0];
    if (curies[prefix]) return true;
  }

  curies = _.at(doc, "h:pvt.globalCuries");

  if (curies[0]) {
    curies = curies[0];
    if (curies[prefix]) return true;
  }

  return false;
};

u.removePrefixIfCURIE = (phrase, doc) => {
  if (phrase.includes(":")) { // possible CURIE
    const [prefix, nonce] = phrase.split(":");
    const validPrefix = u.verifyPrefix(prefix, doc);
    if (validPrefix) { // yeap, a CURIE
      return nonce;
    }
  }
  return phrase;
};

u.skipProps = ["h:ref", "h:link", "h:head", "h:type", "h:pvt"];

module.exports = u;
