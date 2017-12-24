# Kokua - Hypermedia Representor

> Kōkua (Hawaiian) - help, aid, assistance

<!-- Pronounciation: http://hawaiian-words.com/ -->

Kokua is an implementation of the [Representor](https://github.com/the-hypermedia-project/charter#representor-pattern) pattern, written
in modern Javascript/Node. It allows developers to represent hypermedia messages
in a flexible media type, purpose-designed for the task: [Hyper](http://hyperjson.io)
and automatically outputs messages in a variety of popular Hypermedia formats
such as:

1. HAL (application/hal+json)
2. Siren (application/vnd.siren+json)
3. Collection+JSON (application/vnd.collection+json)
4. UBER (application/vnd.uber+json)
5. etc.

## Usage

```Javascript
  const kokua = require("kokua");
  let representor = kokua();
  let uberDoc = kokua(hyperDoc, kokua.mt('uber'));
```
