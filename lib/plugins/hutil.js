const u =  {};

const _   = require("lodash");
const log = require("metalogger")();

u.actionToHTTP = (action) => {
  const map = {
    "append" : "POST",
    "partial" : "PATCH",
    "read" : "GET",
    "remove" : "DELETE",
    "replace" : "PUT"
  };

  if (!map[action]) {
    throw new Error("Unknown Hyper action: " + action);
  }
  return map[action];
};

/**
 * Make sure a CURIE prefix has been declared in h:head and is not bogus
 *
 * @param {*} doc
 * @param {*} prefix
 */
u.verifyPrefix  = (doc, prefix) => {
  let curies = _.at(doc, "h:head.curies");
  if (!curies[0]) return false;
  curies = curies[0];
  if (!curies[prefix]) return false;

  return true;
};

u.skipProps = ["h:ref", "h:link", "h:head", "h:type"];

module.exports = u;
