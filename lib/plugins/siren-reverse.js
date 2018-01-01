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

}

module.exports = (doc) => {
  const representor = new SirenPlugin(doc);
  return representor;
};
