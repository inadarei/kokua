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

  constructor(doc, mediaType, reverse = false) {
    if (!this.isSupportedMediaType(mediaType)) {
      throw new Error(`Kokua representor doesn't yet support '${mediaType}' media type.`);
    }
    this.format = mediaTypes[mediaType];
    let pluginFilePath = `plugins/${this.format}`;
    if (reverse) {
      pluginFilePath = `plugins/${this.format}-reverse`;
    }

    try {
      const fullPluginPath = require('path').join(__dirname, pluginFilePath);
      if (typeof doc !== 'object') { doc = JSON.parse(doc); }
      this.doc = doc;

      this.representor = require(fullPluginPath);
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        const to_or_from = reverse ? "from" : "to";
        throw new Error(`Conversion ${to_or_from} '${mediaType}' is not yet implemented!`);
      } else {
        throw err;
      }
    }
  }

  isSupportedMediaType(mediaType) {
    if (!mediaTypes[mediaType]) return false;
    return true;
  }

  translate() {
    return this.representor(this.doc).translate();
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
  return kokua.translate();
};

module.exports.mt = Kokua.prototype.mt;

module.exports.parse = (doc, srcFormat) => {
  const kokua = new Kokua(doc, srcFormat, true);
  return kokua.translate();
};

// exported mostly for testing purposes.
module.exports.isSupportedMediaType = Kokua.prototype.isSupportedMediaType;
