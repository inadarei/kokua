const log = require("metalogger")();
const _   = require("lodash");

const formats = {
  "hal" : "application/hal+json",
  "siren" : "application/vnd.siren+json",
  "coljson" : "application/vnd.collection+json",
  "uber" : "application/vnd.uber+json"
};
const mediaTypes = _.invert(formats);


class Kokua {

  constructor(doc, mediaType) {
    if (!this.isSupportedMediaType(mediaType)) {
      throw new Error(`Kokua representor doesn't yet support '${mediaType}' media type.`);
      return;
    }
    this.format = mediaTypes[mediaType];
    const pluginFilePath = `plugins/${this.format}`;
    const fullPluginPath = require('path').join(__dirname, pluginFilePath);

    if (typeof doc !== 'object') { doc = JSON.parse(doc); }
    this.doc = doc;

    this.representor = require(fullPluginPath);
  }

  isSupportedMediaType(mediaType) {
    if (!mediaTypes[mediaType]) return false;
    return true;
  }

  translate() {
    return this.representor(this.doc);
  }
  /**
   * Provided media type's shortname, return full media type descriptor
   */
  mt(shortname) {
    if (formats[shortname]) return formats[shortname];
    return null;
  }
}

module.exports = (doc, format) => {
  const kokua = new Kokua(doc, format);
  if (typeof kokua === 'object') {
    return kokua.translate();
  } else {
    return null;
  }

};

module.exports.mt = Kokua.prototype.mt;
module.exports.isSupportedMediaType = Kokua.prototype.isSupportedMediaType;
