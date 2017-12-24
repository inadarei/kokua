// const log = require("metalogger")();

class HalPlugin {
  constructor(message) {
    this.doc = message;
  }

  translate() {
    this.newDoc = {};
    this.handleBodyProps();
  }

  hanldeLinks() {

  }

  handleCuries() {

  }

  handleBodyProps() {
    const body = this.doc.body;
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
