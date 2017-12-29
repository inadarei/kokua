# Kōkua - Plugin Developer's Guide

Typical structure of a plugin looks like the following:

```javascript
const log      = require("metalogger")();
const _        = require("lodash");
const traverse = require("traverse");
const hutil    = require("./hutil");

class YourNewPlugin {
  constructor(message) {
    if (typeof message !== 'object') {
      this.doc = JSON.parse(message);
    } else {
      this.doc = message;
    }
    this.newDoc = {};
  }

  translate() {
    this.handleSomeTransformation();
    this.hanldeAnotherTransformation();
    this.hanldeYetAnotherTransformation();

    return this.newDoc;
  }
}

module.exports = (doc) => {
  const representor = new YourNewPlugin(doc);
  return representor;
};
```

To add a new implementation to Kokua, a corresponding setting should be
added to the list of supported plugins in lib/kokua.js:

```javascript
const formats = {
  "hal" : "application/hal+json",
  "siren" : "application/vnd.siren+json",
  "coljson" : "application/vnd.collection+json",
  "uber" : "application/vnd.uber+json",

  "shortname" : "official/media+type"

};
```

Last but not least: obviously a plugin should be fully covered with tests.
