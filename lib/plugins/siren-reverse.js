const log      = require("metalogger")(); // eslint-disable-line no-unused-vars
const _        = require("lodash");
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
    this.processEntities();

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

    for (const link of this.doc.links) {
      if (link.rel && Array.isArray(link.rel)) {
        if (link.rel.length === 1) {
          this.addLinkToHref (link);
        }
        if (link.rel.length > 1) {
          this.addLinktoHlink (link);
        }
      }
    }
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

    for (const action of this.doc.actions) {
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
    }
  }


  processEntities() {
    if (!this.doc.entities) return;
    if (!Array.isArray(this.doc.entities)) {
      throw new Error(`In Siren entities must be an array, instead received: ${this.doc.entities}`);
    }

    if (!this.newDoc.entities) {
      this.newDoc.entities = [];
    }

    const entities = this.doc.entities;
    for (const entity of entities) {
      if (this.isEmbeddedLink(entity)) {
        this.convertEmbeddedLink(entity);
        this.newDoc.entities.push(entity);
      } else {
        const representor = new SirenPlugin(entity);
        representor.translate();
        this.newDoc.entities.push(representor.newDoc);
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
    const allowedProps = ["class", "rel", "href", "type", "title"];
    const keys = _.keys(obj);
    for (const key of keys) {
      if (!allowedProps.includes(key)) return false;
    }

    return true;
  }

  /**
   * Siren has notion of a "regular" sub-entity and a sub-entity that is just an
   * embedded link. The latter gets formatted very differently, unfortunately,
   * so it needs to be processed separately. This method modifies the object.
   *
   * @param obj is modified by reference
   */
  convertEmbeddedLink(obj) {

    if (!obj.rel || !Array.isArray(obj.rel)) {
      throw new Error (`In Siren rel is a required field for embedded links, instead got: ${obj}`);
    }

    if (obj.class) {
      if (!obj["h:type"]) obj["h:type"] = [];
      for (const clazz of obj.class) {
        obj["h:type"].push(clazz);
      }
      delete obj["class"];
    }

    if (obj.rel.length === 1) { // we can do this with simple h:ref
      obj["h:ref"] = {};
      obj["h:ref"][obj.rel] = obj.href;
      delete obj["rel"];
      delete obj["href"];
    } else { // need an h:link
      obj["h:link"] = []; const hlink = {};
      hlink.rel = obj.rel;
      delete obj["rel"];
      hlink.uri = obj.href;
      obj["h:link"].push(hlink);
      delete obj["href"];
    }

    if (obj.title) {
      obj["h:link"].label = obj.title;
      delete obj["title"];
    }
  }

}

module.exports = (doc) => {
  const representor = new SirenPlugin(doc);
  return representor;
};
