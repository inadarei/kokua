const log      = require("metalogger")();
const _        = require("lodash");
const traverse = require("traverse");

const skipProps = ["h:ref", "h:link", "h:head"];

class HalPlugin {
  constructor(message) {
    this.doc = message;
  }

  translate() {
    this.newDoc = {};
    this.handleCuries();
    this.hanldeTopLevelHrefs();
    this.hanldeTopLevelLinks();
    this.copyBodyProps();
    this.handleBody();


    log.info("$$$$$$$$$$$ ", this.newDoc);
    return this.newDoc;
  }

  hanldeTopLevelHrefs() {
    const msg = this.doc;
    if (!msg["h:ref"]) return;
    const refs = msg["h:ref"];
    if (typeof refs !== 'object') return;

    if (!this.newDoc._links) {
      this.newDoc._links = {};
    }
    this.href_to_halLinks(refs, this.newDoc._links);
  }

  /**
   *
   * @param {*} hrefs
   * @param {*} _links is modified by reference
   */
  href_to_halLinks(hrefs, _links) {
    for (const rel in hrefs) {
      const link = {};
      link.href = hrefs[rel];
      _links[rel] = link;
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

    this.hlinks_to_halLinks(links, this.newDoc._links);
  }
  /**
   *
   * @param {*} hlinks
   * @param {*} _links is modified by reference
   */
  hlinks_to_halLinks(hlinks, _links) {
    hlinks.forEach((link) => {
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
          if (!_links[rel]) {
            _links[rel] = linkObj;
          } else {
            const existingLink = this.newDoc._links[rel];
            _links[rel] = [];
            _links[rel].push(existingLink);
            _links[rel].push(linkObj);
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

  handleBody() {
    let curr;
    traverse(this.newDoc).paths().forEach((path) => {
      log.info("path ", path);
      curr = traverse(this.newDoc).get(path);
      if (typeof curr === 'object') {
        if (!Array.isArray(curr)) {
          if (curr["h:ref"] || curr["h:link"]) {
            const currPath = path.slice();
            this.turnIntoAnEmbed(currPath);

            curr = traverse(this.newDoc).get(path); //refresh
            if (curr["h:ref"]) {
              if (!curr["_links"]) {
                curr["_links"] = {};
              }
              this.href_to_halLinks(curr["h:ref"], curr["_links"]);
              delete curr["h:ref"];
            }

            if (curr["h:link"]) {
              this.hlinks_to_halLinks(curr["h:link"], curr["_links"]);
              delete curr["h:link"];
            }

            traverse(this.newDoc).set(path, curr);
          }
        }
      }
    });
  }

  turnIntoAnEmbed(currPath) {
    // find first
    let notfound = true;
    let prevPath = currPath.slice(); // copy
    let goodEl;
    while (notfound) {
      prevPath = currPath.slice();
      currPath.pop();
      goodEl = traverse(this.newDoc).get(currPath);
      if (currPath.length > 0) {
        if (!Array.isArray(goodEl)) {
          notfound = false;
          traverse(this.newDoc).set(currPath, { "_embedded" : goodEl});
        }
      } else {  // ran out. It's a top-level embed
        if (prevPath.length < 1 ) break; // Just root element.
        const newGoodEl = {}; newGoodEl[prevPath[0]] = this.newDoc[prevPath[0]];
        delete this.newDoc[prevPath[0]];
        notfound = false;
        if (this.newDoc && (typeof this.newDoc._embedded === 'object')) {
          if (Array.isArray(this.newDoc._embedded)) {
            this.newDoc._embedded.push(newGoodEl);
          } else { // exists but is a single object
            const backup = this.newDoc._embedded;
            this.newDoc._embedded = [];
            this.newDoc._embedded.push(backup);
            this.newDoc._embedded.push(newGoodEl);
          }
        } else {
          this.newDoc._embedded = newGoodEl;
        }
      }
    }
  }

  copyBodyProps() {
    const body = this.doc;
    for (let prop in body) {
      if (!skipProps.includes(prop)) {
        this.newDoc[prop] = body[prop];
      }
    }
  }
}

module.exports = (doc) => {
  const representor = new HalPlugin(doc);
  representor.translate();
  return representor.newDoc;
};
