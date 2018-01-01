# Kōkua - Hypermedia Representor

> Kōkua (Hawaiian) - help, aid, assistance

  [![NPM Version][npm-image]][npm-url]
  [![Build][travis-image]][travis-url]
  [![Test Coverage][coveralls-image]][coveralls-url]
  <!-- [![Codecov][codecov-image]][codecov-url] -->

<!-- Pronounciation: http://hawaiian-words.com/ -->

Kōkua is an implementation of the [Representor](https://github.com/the-hypermedia-project/charter#representor-pattern) pattern, written
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

### Convert a Hyper document to other formats

```Javascript
  const kokua = require("kokua");
  let halDoc = kokua(hyperDoc, kokua.mt('hal'));
```

where the first argument to a `kokua()` call is a JSON document formatted as a
Hyper document, and the second argument is the name of a supported media-type
that we want the message to be translated to.

### Convert a document in another format to Hyper

```Javascript
  const kokua = require("kokua");
  let uberDoc = kokua.parse(halDoc, kokua.mt('hal'));
```

where the first argument to a `kokua.parse()` call is a JSON document formatted
in a media type, supported by Kokua, and the second argument is the name of a
supported media-type that we want the message to be translated from.

Please see the official specification for
[Hyper](https://github.com/inadarei/hyper) media type, for more details about
the format.

### Advanced Example

```Javascript

  const hyperDoc = const hyper = {
    "h:head": {"curies": {"ea": "http://example.com/docs/rels/"}},
    "h:ref": {"self": "/orders", "next": "/orders?page=2"},
    "currentlyProcessing": 14, "shippedToday": 20,
    "ea:order": [
      {
        "h:ref": {
          "self": "/orders/123",
          "ea:basket": "/baskets/98712",
          "ea:customer": "/customers/7809"
        },
        "total": 30, "currency": "USD", "status": "shipped"
      },
      {
        "h:ref": {
          "self": "/orders/123",
          "ea:basket": "/baskets/98712",
          "ea:customer": "/customers/124234"
        },
        "total": 123, "currency": "USD", "status": "pending"
      }
    ]
  };

  const kokua = require("kokua");
  let halDoc = kokua(hyperDoc, kokua.mt('hal'));
  let sirenDoc = kokua(hyperDoc, kokua.mt('siren'));
```

## Implementation Status

1. Hyper to HAL: 100%
    - Reverse: 0%
1. Hyper to Siren: 100%
    - Reverse: 35%
1. Hyper to UBER: 0%
    - Reverse: 0%
1. Hyper to Collection+JSON: 0%
    - Reverse: 0%
1. Hyper to JSONAPI: 0%
    - Reverse: 0%

### Quick-n-dirty benchmark

```BASH
> node benchmark.js
Time to convert HAL 10,000 times:  2.572 ms
Time to convert Siren 10,000 times:  1.42 ms
```

### Plugin Development

If you are interested in developing a new plugin to implement translation to a
hypermedia format that is not yet implemented, please refer to
[README-PLUGINDEV](README-PLUGINDEV.md)

[npm-image]: https://img.shields.io/npm/v/kokua.svg
[npm-url]: https://npmjs.org/package/kokua
[travis-image]: https://img.shields.io/travis/inadarei/kokua/master.svg?label=Build
[travis-url]: https://travis-ci.org/inadarei/kokua
[codecov-image]: https://codecov.io/gh/inadarei/kokua/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/inadarei/kokua
[coveralls-image]: https://img.shields.io/coveralls/inadarei/kokua/master.svg
[coveralls-url]: https://coveralls.io/r/inadarei/kokua?branch=master
