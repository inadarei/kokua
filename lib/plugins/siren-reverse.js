const log      = require("metalogger")();
const _        = require("lodash");
const traverse = require("traverse");
const hutil    = require("../hutil");

// Src for siren-wurl.json: http://developers.wurl.com/pages/guides/search

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
    //this.preprocess();
    this.processProperties();
    this.processLinks();
    this.processActions();
    //this.processEntities();

    return this.newDoc;
  }

  /**
   * Import properties, title and class attributes.
   */
  processProperties() {
    const body = this.doc.properties ? this.doc.properties : {};

    for (const prop in body) {
      this.newDoc[prop] = body[prop];
    }

    if (this.doc.class) {
      if (!Array.isArray(this.doc.class)) {
        throw new Error ("In Siren messages 'class' must be an array");
      }
      this.newDoc["h:type"] = this.doc.class;
    }

    if (this.doc.title) {
      this.newDoc["h:label"] = this.doc.title;
    }
  }

  processLinks() {
    if (!this.doc.links) return;
    if (!Array.isArray(this.doc.links)) {
      throw new Error("In Siren messages 'links' must be an array");
    }

    this.doc.links.forEach( (link) => {
      if (link.rel && Array.isArray(link.rel)) {
        if (link.rel.length === 1) {
          this.addLinkToHref (link);
        }
        if (link.rel.length > 1) {
          this.addLinktoHlink (link);
        }
      }

    });

  }

  addLinkToHref(link) {
    if (!this.newDoc["h:ref"]) {
      this.newDoc["h:ref"] = {};
    }
    this.newDoc["h:ref"][link.rel[0]] = link.href;
  }

  addLinktoHlink(link) {
    if (!this.newDoc["h:link"]) {
      this.newDoc["h:link"] = [];
    }

    const hlink = {};
    hlink.rel = link.rel;
    hlink.uri = link.href;
    if (link.title) {
      hlink.label = link.title;
    }

    this.newDoc["h:link"].push(hlink);
  }

  processActions() {
    if (!this.doc.actions) return;
    if (!Array.isArray(this.doc.actions)) {
      throw new Error("In Siren messages 'actions' must be an array");
    }

    if (!this.newDoc["h:link"]) {
      this.newDoc["h:link"] = [];
    }

    this.doc.actions.forEach( (action) => {
      const hlink = {};
      hlink.template = {};

      if (action.type) {
        hlink.template.contentType = action.type;
      }
      if (action.fields && typeof action.fields === 'object') {
        hlink.template.fields = {};
        for (const idx in action.fields) {
          const fieldname = action.fields[idx].name;
          const fieldvalue = action.fields[idx];
          hlink.template.fields[fieldname] = {};
          if (fieldvalue.type) {
            hlink.template.fields[fieldname].type = fieldvalue.type;
          }
          if (fieldvalue.value) {
            hlink.template.fields[fieldname].default = fieldvalue.value;
          }
          if (fieldvalue.title) {
            hlink.template.fields[fieldname].label = fieldvalue.title;
          }
        }
      }
      hlink.uri = action.href;
      if (action.title) hlink.label = action.title;
      if (action.method) hlink.action = hutil.httpToAction(action.method);

      this.newDoc["h:link"].push(hlink);
    });
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
            if (this.ifEmbeddedLink(obj)) {
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

          });
        } else {
          if (this.ifEmbeddedLink(body[prop])) {
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
  ifEmbeddedLink(obj) {
    const keys = _.keys(obj);
    if (!_.isEqual(keys, ["h:type", "h:ref"]) &&
        !_.isEqual(keys, ["h:type", "h:link"]) ) {
      return false;
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
