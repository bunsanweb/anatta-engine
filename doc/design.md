# Design of the Anatta Engine

The `Engine` has three aspects:

- The `Engine` is a runtime for hyperlink programming
- The `Engine` is a provider to make any resource a Web resource
- The `Engine` is a gateway for hyperlink programs as web resources

Each aspect will be cover in its own design overview of the `Engine`.

## Overview of the hyperlink structure

The `Engine` instance is an environment for URI space and metadata mapping for resources.

The resource pointed with the URI is `Link` instance.
The `Link` has the methods `get()`, `put(message)`, `post(message)`, `delete()`; the same as HTTP methods.
The `Link` methods return an `Entity` instance as a representational data for the `Link`.
The `Entity` can access as key-value style data set and list `Link`s inside.

As a hyperlinks system, accessing the route with `Link`-`Entity`-`Link`-... 
The route `Link` is acquired by `link = engine.link(uri)`.

The `Link` and `Entity` is a subclass of `Metadata`.
Accessing the HTTP methods and key-value data set is in the `Metadata` facility.

- `Link` inside `Entity` has several properties, e.g. a link label, that can access as a value
    - grouping `Link`s with the property in the `Link`s (not as `Entity` attributes)
- `Entity` is bound to its origin URI, so it can GET/PUT/POST/DELETE same as `Link`

The built-in `Entity`'s data format is HTML, JSON, and ATOM XML.
Other format bindings can be added to `Porter` as a resolver by using the "content-type".

The `Metadata` is also required to some mapping for key-value relations.
The mapping system is `TermSet`. The `TermSet` denotes:

- applying filters as URI pattern and content-type
- mapping for key-value relation and `Link` list in the `Entity`
- mapping for key-value to a `Link` in the above `Entity` 

The `TermSet` database is called `Glossary`. 
Each `Engine` manages its `Glossary` as `engine.glossary`.

## Overview of the URI space management

The backend of the `Engine` provides sources of the `Entity` for the URIs.
The backend system is called the `Space`.
It has a similar interface for Web accessing with `Request` and `Response`.
The `Space` has a `Promise` based interface `access` as `space.access(request).then(response => ...)`.

The `Request` has URI, HTTP method and a sending message if exist.
The `Response` has just blob and headers include content-type.
Above `Entity` wraps both `Request`, `Response` and the `TermSet`.

The concrete implementations to the resource binding are called `Field`.
Each `Field` implements specialized method as `access(request)`.
The builtin `Field`s are

- `FileField`: access to the local file system
- `WebField`: access to the HTTP/S web
- `DataField`: resolves to `data:` URIs 
- `OrbField`: access to `Orb` cache storages
- `AgentField`: access to the program using the `Engine` system
- `GalaxyField` access to the sub `Engine` (engine-in-engine)

The space maps each `Field` inside a URI pattern.
They are not local paths as "/foo/bar", They maps as universal URIs not limited in local 
as "http:" or "file://foo/bar". 

## Overview of the `Engine` program in the `Engine`

The `Engine` system can be used inside of the `Engine`. 
It provides resources for URI access.
The system calls `weaver`.
Each user program inside `Engine` is called an `Agent`.

The `Agent` has an internal state and has an interface to the `Engine`.
The `Agent` has a `window` instance as same as the browser's `window` object in JavaScript programs.
The `Agent`'s `window` also has `document` instance that can hold the user program states.

The `Agent` program interact with the `Engine` from `window` events.
For example, A boot time event is `"agent-load"`, and an event for access from outside is `"agent-access"`.
The `Event` object of `"agent-access"` has special members for request/response from outside access,
that can write response data.
The special object `window.anatta` is  a set of builtin functions for accessing to their owner`Engine`.
For example, user programs can use a `Link` object by using `window.anatta.engine.link(url)`.

## `Engine` builder

Preparing the `Engine` is a little difficult for specific object instantiation, for example, 
the `Field`s in the module have their own specialized properties that bind it to the `Space` of the `Engine`.
The `anatta.engine.builder.engine(desc)` can build an `Engine` initialized with just a JSON object descriptor.

The builder description has two format as `generic` description and `simple` description.
The `generic` format is directly pass the option JSON to each `Field` constructor.
The `simple` format makes  same type of `Fields` at once with almost default options.

## `Metadata` structure

The `Link` and the `Entity` is a sub class of `Metadata`.
They share methods defined by `Metadata`.

- `get()`: returns `Promise` of `Entity`
- `put({headers, body})`: returns `Promise` of `Entity`
- `post({headers, body})`: returns `Promise` of `Entity`
- `delete({headers, body})`: returns `Promise` of `Entity`
    - `headers`: `string` key-value object
    - `body`: `Buffer` like object: `Buffer`, UTF-8 `string` and `Uint8Array`

Both `Link` and `Entity` bind URI. These methods access for the URI of them (same as HTTP methods).

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
When `Entity` is a document, the `Links` are hyperlinks within the document, 
but not only URIs, they includes a parts around the hyperlinks.
For example, when HTML documents consists list of the "article"-tags with "a"-tag hyperlink, 
each `Link` covers whole an "article" tag that includes several properties for its hyperlink.

## Request/Response as an `Agent`

User programs in the `Engine` are accessed from outside, the script can get it with the event `"agent-access"`.
The script for responding to outside access for the HTML of `Agent`:

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
of the "agent-access" responds with the serialized HTML of the `window.document`.


