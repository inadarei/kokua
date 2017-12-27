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
    this.hanldeTopLevelHrefs();
    this.hanldeTopLevelLinks();
  }

  hanldeTopLevelHrefs() {
    const msg = this.doc;
    if (!msg["h:ref"]) return;
    const refs = msg["h:ref"];
    if (typeof refs !== 'object') return;

    if (!this.newDoc._links) {
      this.newDoc._links = {};
    }

    for (const rel in refs) {
      const linkObj = {};
      linkObj.href = refs[rel];
      this.newDoc._links[rel] = linkObj;
    }
  }


  // "uri": "/orders{?id}",
  // "template": {"fields": {"id": {}}}
  // "ea:find": {"href": "/orders{?id}", "templated": true},
  hanldeTopLevelLinks() {
    const msg = this.doc;
    if (!msg["h:link"]) return;
    const links = msg["h:link"];
    if (typeof links !== 'object') return;

    if (!this.newDoc._links) {
      this.newDoc._links = {};
    }

    links.forEach((link) => {
      if (link.rel) {
        link.rel.forEach((rel) => {
          const linkObj = {};
          linkObj.href = link.uri;
          if (link.template && typeof link.template === 'object') {
            linkObj.templated = true;
          }
          if (link.label) {
            linkObj.title = link.label;
          }
          if (!this.newDoc._links[rel]) {
            this.newDoc._links[rel] = linkObj;
          } else {
            const existingLink = this.newDoc._links[rel];
            this.newDoc._links[rel] = [];
            this.newDoc._links[rel].push(existingLink);
            this.newDoc._links[rel].push(linkObj);
          }
        });
      }
    });

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
