// const log = require("metalogger")();
const _ = require("lodash");

class HalPlugin {
  constructor(message) {
    this.doc = message;
  }

  translate() {
    this.newDoc = {};
    this.handleBodyProps();
    this.handleCuries();
  }

  hanldeLinks() {

  }

  handleCuries() {
    const msg = this.doc;
    if (!msg["h:head"]) return;
    if (!msg["h:head"].curies) return;
    const curies = msg["h:head"].curies;
    if (typeof curies !== 'object') return;

    if (!this.newDoc._links) {
      this.newDoc._links = {};
    }
    if (!this.newDoc._links.curies) {
      this.newDoc._links.curies = [];
    }
    for (const prefix in curies) {
      const curieObj = {};
      curieObj.name = prefix;
      curieObj.href = curies[prefix] + "{var}";
      curieObj.templated = true;
      this.newDoc._links.curies.push(curieObj);
    }
  }

  handleBodyProps() {
    const body = this.doc;
    for (const prop in body) {
      if (typeof body[prop] !== 'object') {
        this.newDoc[prop] = body[prop];
      }
    }
  }

  handleEmbeds() {

  }
}

module.exports = (doc) => {
  const representor = new HalPlugin(doc);
  representor.translate();
  return representor.newDoc;
};
