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

    return this.newDoc;
  }

  hanldeTopLevelHrefs() {
    const msg = this.doc;
    if (!msg["h:ref"]) return;
    const refs = msg["h:ref"];
    if (typeof refs !== 'object' || Array.isArray(refs)) {
      const errMsg = "h:ref must be a JSON object, instead received: " + JSON.stringify(refs);
      throw new Error(errMsg);
    }

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
    if (typeof hrefs !== 'object' || Array.isArray(hrefs)) {
      const errMsg = "h:ref must be a JSON object, instead received: " + JSON.stringify(hrefs);
      throw new Error(errMsg);
    }

    for (const rel in hrefs) {
      const link = {};
      link.href = hrefs[rel];
      _links[rel] = link;
    }
  }

  hanldeTopLevelLinks() {
    const msg = this.doc;
    if (!msg["h:link"]) return;
    const links = msg["h:link"];
    if (typeof links !== 'object' || !Array.isArray(links)) {
      const errMsg = "h:link must be an array, instead received: " + JSON.stringify(links);
      throw new Error(errMsg);
    }

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
    if (!hlinks || !Array.isArray(hlinks)) {
      const errMsg = "h:link must be an array, instead received: " + JSON.stringify(hlinks);
      throw new Error(errMsg);
    }
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
      } else {
        const errMsg = "A rel property is required on any h:link, instead received: " + JSON.stringify(hlinks);
        throw new Error(errMsg);
      }
    });
  }

  handleCuries() {
    const msg = this.doc;
    if (!msg["h:head"]) return;
    if (!msg["h:head"].curies) return;
    const curies = msg["h:head"].curies;
    if (typeof curies !== 'object') {
      const errMsg = "In h:head, curies must be an object, instead received: " + JSON.stringify(curies);
      throw new Error(errMsg);
    }

    /* istanbul ignore next */
    if (!this.newDoc._links) {
      this.newDoc._links = {};
    }
    /* istanbul ignore next */
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
    traverse(this.doc).paths().forEach((path) => { // unfortunately _.at() doesn't do the same thing :(
      //log.info("path ", path);
      //curr = _.cloneDeep(traverse(this.doc).get(path));
      curr = _.cloneDeep(_.get(this.doc, path));
      if (typeof curr === 'object') {
        if (!Array.isArray(curr) && !skipProps.includes(path[0])) {
          if (curr["h:ref"] || curr["h:link"]) {
            const currPath = path.slice();
            this.turnIntoAnEmbed(currPath);


            //curr = traverse(this.doc).get(path); //refresh
            curr = _.get(this.doc, path); //refresh without cloning.
            if (curr["h:ref"]) {
              /* istanbul ignore next */
              if (!curr["_links"]) {
                curr["_links"] = {};
              }
              this.href_to_halLinks(curr["h:ref"], curr["_links"]);
              delete curr["h:ref"];
            }

            if (curr["h:link"]) {
              /* istanbul ignore next */
              if (!curr["_links"]) {
                curr["_links"] = {};
              }
              this.hlinks_to_halLinks(curr["h:link"], curr["_links"]);
              delete curr["h:link"];
            }
          }
        }
      }
    });
  }

  turnIntoAnEmbed(currPath) {
    // find first
    let keepSearching = true;
    let goodEl;
    while (keepSearching) {
      const prevPath = currPath.slice();
      currPath.pop();
      // goodEl = traverse(this.doc).get(currPath);
      goodEl = _.get(this.doc, currPath);
      if (currPath.length > 0) {
        if (!Array.isArray(goodEl)) {
          keepSearching = false;
          // traverse(this.newDoc).set(currPath, { "_embedded" : goodEl});
          _.set(this.newDoc, currPath, { "_embedded" : goodEl});
        }
      } else {  // ran out. It's a top-level embed
        keepSearching = false;
        if (prevPath.length < 1 ) break; // Just a root element, not really a match.

        if (!this.newDoc._embedded) this.newDoc._embedded = {};
        this.newDoc._embedded[prevPath[0]] = this.doc[prevPath[0]];
        delete this.newDoc[prevPath[0]];
      }
    }
  }

  copyBodyProps() {
    const body = this.doc;
    for (const prop in body) {
      if (!skipProps.includes(prop)) {
        this.newDoc[prop] = body[prop];
      }
    }
  }
}

module.exports = (doc) => {
  const representor = new HalPlugin(doc);
  return representor;
};
