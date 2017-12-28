# Kōkua - Hypermedia Representor

> Kōkua (Hawaiian) - help, aid, assistance

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

```Javascript
  const kokua = require("kokua");
  let uberDoc = kokua(hyperDoc, kokua.mt('uber'));
```

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
  let uberDoc = kokua(hyperDoc, kokua.mt('uber'));
```

## Implementation Status

1. Hyper to HAL: 100%
    - Reverse: 0%
2. Hyper to UBER: 0%
    - Reverse: 0%
3. Hyper to Siren: 0%
    - Reverse: 0%
4. Hyper to Collection+JSON: 0%
    - Reverse: 0%
5. Hyper to JSONAPI: 0%
    - Reverse: 0%

### Test Coverage:

```
============ Coverage summary ============
Statements   : 99.26% ( 135/136 )
Branches     : 98.61% ( 71/72 )
Functions    : 100% ( 19/19 )
Lines        : 100% ( 127/127 )
===========================================
```
