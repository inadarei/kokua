const log      = require("metalogger")();
const _        = require("lodash");
const traverse = require("traverse");
const hutil    = require("../hutil");

class SirenPlugin {
  constructor(message) {
    if (typeof message !== 'object') {
      this.doc = JSON.parse(message);
    } else {
      this.doc = _.clone(message);
    }
    this.newDoc = {};
  }

  translate() {
    this.preprocess();
    this.processProperties();
    this.processTopHref();
    this.processTopLink();

    return this.newDoc;
  }

  preprocess() {
    if (!this.doc["h:head"].globalCuries) {
      this.doc["h:head"].globalCuries = this.doc["h:head"].curies;
    }
  }

  processProperties() {
    const body = this.doc;
    if (!this.newDoc.properties) this.newDoc.properties = {};

    for (const prop in body) {
      if (!hutil.skipProps.includes(prop) && (typeof body[prop] !== 'object')) {
        this.newDoc.properties[prop] = body[prop];
      }

      if (prop === 'h:type') {
        this.newDoc.class = [];
        const types = body[prop];
        if (!Array.isArray(types)) {
          throw new Error ("In Hyper messages h:type must be an array");
        }

        types.forEach((type) => {
          type = hutil.removePrefixIfCURIE(type, this.doc);
          this.newDoc.class.push(type);
        })

        if (this.newDoc.class.length <1) {
          delete this.newDoc['class'];
        }
      }
    }

    if (_.isEqual(this.newDoc.properties, {})) {
      delete this.newDoc['properties'];
    }
  }

  processTopHref() {
    const hrefs = (this.doc["h:ref"]) ? this.doc["h:ref"] : {};
    if (!this.newDoc.links) this.newDoc.links = [];

    for (const href in hrefs) {
      // {"rel": ["self"], "href": "http://api.x.io/orders/42"},
      const link = {};
      link.rel = [href];
      link.href = hrefs[href];
      this.newDoc.links.push(link);
    }
  }

  processTopLink() {
    const hlinks = (this.doc["h:link"]) ? this.doc["h:link"] : [];
    if (!this.newDoc.actions) this.newDoc.actions = [];

    hlinks.forEach((hlink) => {
      const action = {};
      if (hlink["rel"]) {
        const rel = hlink["rel"][0]; // Siren actions only have one rel. Data loss may occur.
        action.name = hutil.removePrefixIfCURIE(rel, this.doc);
      }
      if (hlink["h:label"]) action.title = hlink["h:label"];
      if (hlink["action"]) action.method = hutil.actionToHTTP(hlink["action"]);
      if (hlink["uri"]) action.href = hlink["uri"];
      if (hlink["contentType"]) action.type = hlink["contentType"];

      if (hlink["fields"]) {
        action.fields = [];
        for (const fieldname in hlink["fields"]) {
          const field = {};
          field.name = fieldname;
          field.type = hlink["fields"][fieldname]["type"] ? hlink["fields"][fieldname]["type"] : "text";
          if (hlink["fields"][fieldname]["default"]) {
            field.value = hlink["fields"][fieldname]["default"];
          }
          action.fields.push(field);
        }
      }

      this.newDoc.actions.push(action);
    });

    // No need for empty actions property
    if (this.newDoc.actions.length <1) {
      delete this.newDoc['actions'];
    }
  }

  processEntities() {
    const body = this.doc;
    for (const prop in body) {
      if (!hutil.skipProps.includes(prop) && (typeof body[prop] === 'object')) {
        if (!this.newDoc.entities || !Array.isArray(this.newDoc.entities)) {
          this.newDoc.entities = [];
        }

        if (Array.isArray(body[prop])) {
          body[prop].forEach((obj) => {
            const representor = new SirenPlugin(obj);
            representor.translate();
            this.newDoc.entities.push( representor.newDoc );
          })
        } else {
          const representor = new SirenPlugin(body[prop]);
          representor.translate();
          this.newDoc.entities.push( representor.newDoc );
        }

      }
    }
  }
}

module.exports = (doc) => {
  const representor = new SirenPlugin(doc);
  return representor;
};
