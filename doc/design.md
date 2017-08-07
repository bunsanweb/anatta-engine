# Design of Anatta Engine

The `Engine` has three aspects:

- `Engine` as a runtime for hyperlink programmings
- `Engine` as a providers make any resources as Web resources
- `Engine` as a gateway of hyperlink programs as web resources

So, the design overviews of the `Engine` are described for each aspects.

## Overview of the hyperlink structure

The `Engine` instance is an environment for URI space and its metadata mapping for resources.

The resource pointed with the URI is `Link` instance.
The `Link` has the methods `get()`, `put(message)`, `post(message)`, `delete()`; same as HTTP's methods.
The `Link` methods return an `Entity` instance as a representational data for the `Link`.
The `Entity` can access as key-value style data set and list `Link`s inside.

As a hyperlinks system, accessing the route with `Link`-`Entity`-`Link`-... 
The route `Link` is acquired by `link = engine.link(uri)`.

The `Link` and `Entity` is a subclass of `Metadata`.
Accessing the HTTP methods and key-value data set is in `Metadata` facility.

- `Link` inside `Entity` has several properties, e.g. a link label, that can access as a value
    - grouping `Link`s with the property in the `Link`s (not as `Entity` attributes)
- `Entity` bound its origin URI, so it can GET/PUT/POST/DELETE same as `Link`

The builtin `Entity`'s data format is HTML, JSON, and ATOM XML.
The other format bindings can add to `Porter` as a resolver by the "content-type".

The `Metadata` is also required to some mapping for key-value relations.
The mapping system is `TermSet`. The `TermSet` denotes:

- applying filter as URI pattern and content-type
- mapping for key-value relation and `Link` list in the `Entity`
- mapping for key-value to a `Link` in the above `Entity` 

`TermSet` database is called `Glossary`. 
Each `Engine` manages its `Glossary` as `engine.glossary`.

## Overview of the URI space management

The backend of the `Engine` is providing sources of the `Entity` for the URIs.
The backend system is called as `Space`.
It has similar interface for Web accessing with `Request` and `Response`.
The `Space` has a `Promise` based interface `access` as `space.access(request).then(response => ...)`.

The `Request` has URI, HTTP method and a sending message if exist.
The `Response` has just blob and headers include content-type.
Above `Entity` wraps both `Request`, `Response` and the `TermSet`.

The concrete implementations to the resource binding are called `Field`.
Each `Field` implements specialized method as `access(request)`.
The builtin `Field`s are

- `FileField`: access to local file system
- `WebField`: access to HTTP/S web
- `DataField`: resolve to `data:` URIs 
- `OrbField`: access to `Orb` cache storages
- `AgentField`: access to the program using the `Engine` system
- `GalaxyField` access to the sub `Engine` (engine-in-engine)

The space maps each `Field` inside as the URI patterns.
They are  not local paths as "/foo/bar", They maps as universal URIs not limited in local 
as "http:" or "file://foo/bar". 

## Overview of the `Engine` program in the `Engine`

The `Engine` system can be used inside of the `Engine`. 
It provides resources for the URI access.
The system calls `weaver`.
Each user program inside `Engine` is called `Agent`.

The `Agent` has an internal state and has an interface to the `Engine`.
The `Agent` has a `window` instance as same as the browser's `window` object in JavaScript programs.
The `Agent`'s `window` also has `document` instance that can hold the user program states.

The `Agent` program interact with the `Engine` from  `window` events.
For example, An event of boot time is `"agent-load"`, and an event of access from outside is `"agent-access"`.
The `Event` object of `"agent-access"` has special members for request/response from the outside access,
that can write response data.
The special object `window.anatta` is  a set of builtin functions for accessing to their owner`Engine`.
For example, user programs can use a `Link` object by `window.anatta.engine.link(url)`.

## `Engine` builder

Preparing the `Engine` is a little difficult for the specific object instantiation, for example, 
the `Field`s in the module have their own specialized properties then bind it to the `Space` of the `Engine`.
The `anatta.engine.builder.engine(desc)` can build an `Engine` initialized with just a JSON object descriptor.

The builder description has two format as `generic` description and `simple` description.
The `generic` format is directly pass the option JSON to each `Field` constructor.
The `simple` format makes  same type of `Fields` at once with almost default options.

## `Metadata` structure

The `Link` and the `Entity` is sub class of the `Metadata`.
They have same methods defined by the `Metadata`.

- `get()`: returns `Promise` of `Entity`
- `put({headers, body})`: returns `Promise` of `Entity`
- `post({headers, body})`: returns `Promise` of `Entity`
- `delete({headers, body})`: returns `Promise` of `Entity`
    - `headers`: `string` key-value object
    - `body`: `Buffer` like object: `Buffer`, UTF-8 `string` and `Uint8Array`

Both `Link` and `Entity` bounds URI. These methods access for the URI of them (same as HTTP methods).

- `href()`: URI string bound the `Metadata`
- `attr(key)`: returns values in its content specified by the `TermSet`
    - `key`: `string`
- `selector(query)`: returns internal elements for its content
    - `query`: CSS query string
    - Internal element of HTML or ATOM/XML is DOM `Node`
    - Internal element of JSON is JavaScript value

These are the property accessors of the `Metadata` content.
`href()` is special for applied as an URI for above URI access methods.

- `all()`: list of `Link`s inside
- `find(query)`: list of `Link`s inside
- `first(query)`: a `Link` which may be `NilLink`
    - `query`: query matcher  to `Link` property

Accessing `Link`s inside `Entity` is different from property accessing.
When `Entity` is a document, the `Links` are hyperlinks in the document, 
but not only URIs, they includes a parts around the hyperlinks.
For example, when HTML documents consists list of the "article"-tags with "a"-tag hyperlink, 
each `Link` covers whole an "article" tag that includes several properties for its hyperlink.

## Request/Response as an `Agent`

User programs in the `Engine` are accessed from outside, the script can get it with the event `"agent-access"`.
The script for responding the outside accesses for the HTML of `Agent` as:

```js
window.addEventListener("agent-access", event => {
  event.detail.accept();
  if (event.detail.request.method === "GET") {
    setTimeout(() => {
      event.detail.respond("200", {
        "content-type": "text/plain;charset=utf-8"
      }, "Hello World");
    }, 500);
  }
}, false);
```

The `event` of `"agent-access"` has `event.detail` as DOM `CustomEvent`.

- `detail.accept()`: same as calling both `event.stopPropagation()` and `event.preventDefault()`
- `detail.request`: `Request` object same in `space.Request` that includes `method`, `uri`, `headers`, and `body`
- `detail.respond(status, headers, body)`: create `space.Response` object for result of the access
    - `detail.respond()` can call asynchronously

The default result (when not called `event.preventDefault()`) 
of the "agent-access" responds serialized HTML of the `window.document`.


