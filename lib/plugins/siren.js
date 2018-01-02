const log      = require("metalogger")();
const _        = require("lodash");
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
    this.processEntities();

    return this.newDoc;
  }

  preprocess() {
    this.doc["h:pvt"] = {};
    if (!this.doc["h:pvt"].globalCuries) {
      if (this.doc["h:head"]) {
        this.doc["h:pvt"].globalCuries = this.doc["h:head"].curies;
      }
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

        for (let type of types) {
          type = hutil.removePrefixIfCURIE(type, this.doc);
          this.newDoc.class.push(type);
        }

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

    for (const hlink of hlinks) {
      const action = {};
      if (hlink["rel"]) {
        const rel = hlink["rel"][0]; // Siren actions only have one rel. Data loss may occur.
        action.name = hutil.removePrefixIfCURIE(rel, this.doc);
      }
      if (hlink["h:label"]) action.title = hlink["h:label"];
      if (hlink["uri"]) action.href = hlink["uri"];

      if (hlink["template"]) {
        if (hlink["template"]["contentType"]) action.type = hlink["template"]["contentType"];

        if (hlink["template"]["fields"]) {
          action.fields = [];
          for (const fieldname in hlink["template"]["fields"]) {
            const fieldvalue = hlink["template"]["fields"][fieldname];
            const field = {};
            field.name = fieldname;
            field.type = fieldvalue["type"] ? fieldvalue["type"] : "text";
            if (fieldvalue["default"]) {
              field.value = fieldvalue["default"];
            }
            action.fields.push(field);
          }
        }
      }
      if (hlink["action"]) action.method = hutil.actionToHTTP(hlink["action"]);

      this.newDoc.actions.push(action);
    }

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
          for (const obj of body[prop]) {
            if (this.isEmbeddedLink(obj)) {
              this.convertEmbeddedLink(obj);
              this.newDoc.entities.push(obj);
            } else {
              const representor = new SirenPlugin(obj);
              representor.translate();
              // Embeded Entities require `rel` property, but we only have
              // enough info, in Hyper, for `class. So we make rel and class
              // be the same. Reasonable middleground.
              representor.newDoc.rel = representor.newDoc.class;
              this.newDoc.entities.push( representor.newDoc );
            }
          }
        } else {
          if (this.isEmbeddedLink(body[prop])) {
            this.convertEmbeddedLink(body[prop]);
            this.newDoc.entities.push(body[prop]);
          } else {
            const representor = new SirenPlugin(body[prop]);
            representor.translate();
            // Making rel = class, for the same reasons as above.
            representor.newDoc.rel = representor.newDoc.class;
            this.newDoc.entities.push( representor.newDoc );
          }
        }

      }
    }
  }

  /**
   * Siren has notion of a "regular" sub-entity and a sub-entity that is just an
   * embedded link. The latter gets formatted very differently, unfortunately,
   * so it needs to be processed separately. This method checks whether
   * a Hyper object should be treated as an embedded link.
   *
   * @param obj is modified by reference
   */
  isEmbeddedLink(obj) {

    if (typeof obj !== 'object' && Array.isArray(obj) ) return false;
    if ((!obj["h:link"] && !obj["h:ref"]) || !obj["h:type"]) return false;

    const allowedProps = ["h:type", "h:link", "h:ref", "h:label", "name"];
    const keys = _.keys(obj);
    for (const key of keys ) {
      if (!allowedProps.includes(key)) {
        return false;
      }
    }

    if (obj["h:ref"]) {
      if (_.keys(obj["h:ref"]).length !== 1) return false;
    }

    if (obj["h:link"]) {
      if (obj["h:link"].length !== 1) return false;
    }

    return true;

    /*
     * EXAMPLEs:
     * {
     *  "h:type": ["items", "collection"],
     *  "h:ref": {
     *     "http://x.io/rels/order-items": "http://api.x.io/orders/42/items"
     *   }
     * }
     *
     * {
     *  "h:type": ["items", "collection"],
     *  "h:link": [{
     *     "rel" : ["http://x.io/rels/order-items"],
     *     "uri" : "http://api.x.io/orders/42/items"
     *   }]
     * }
     */
  }

  /**
   * Siren has notion of a "regular" sub-entity and a sub-entity that is just an
   * embedded link. The latter gets formatted very differently, unfortunately,
   * so it needs to be processed separately. This method modifies the object.
   *
   * @param obj is modified by reference
   */
  convertEmbeddedLink(obj) {
    obj.class = obj["h:type"];
    delete obj["h:type"];

    if (obj["h:ref"]) {
      for (const prop in obj["h:ref"]) {
        obj.rel = [prop];
        obj.href = obj["h:ref"][prop];
      }
    }
    delete obj["h:ref"];


    if (obj["h:link"]) {
      const link = obj["h:link"][0];
      obj.rel = link.rel;
      obj.href = link.uri;
    }
    delete obj["h:link"];

    /*
    "class": ["items", "collection"],
    "rel": ["http://x.io/rels/order-items"],
    "href": "http://api.x.io/orders/42/items"
    */
  }
}

module.exports = (doc) => {
  const representor = new SirenPlugin(doc);
  return representor;
};
