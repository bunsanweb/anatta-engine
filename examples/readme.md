# Examples of Engine program

Each example can be launched as: ``node run.js``
then you can access it from ``http://localhost:8000/``
on your web browser.

Basic examples:

- [helloworld](helloworld)
- [wiki](wiki)
- [wall](wall)
- [fileuploader](fileuploader)
- [w3cnews](w3cnews)
- [hackernews](hackernews)

Advanced examples:

- [fileuploader2](fileuploader2)
- [statuses](statuses)
- [timeline](timeline)
- [locker](locker)
- [hosting](hosting)

Other examples:

- [unittest](unittest)
- [usefusion](usefusion)

These examples show the concepts that the `Engine` focuses on.
The order of the examples illustrates, in increasing complexity, the programming concepts of the `Engine`.

## `helloworld` example

The [`helloworld` example](helloworld) creates the `Engine` that
the `space` just mapped the `pub` directory by `FileField`,
then reveals at `http://localhost:8000/` with `WebGate`.

- How to create the `Engine`
- How to reveal as Web server

## `wiki` example

The [`wiki` example](wiki) use the built-in `orb` storage directly 
to GET/PUT using browser UI html.

- How to use `orb` storages
- How to access from browsers

The page link format is double square brackets as `[[pagename]]`.

## `wall` example

The [`wall` example](wall) uses a program mapped to the `space` as `agent`.
At first, the source files for agent mapped to the `space` by `FileField`,
then the `agent` load the source file `file:/index.html` by the descriptor.
The `agent` is accessed from browser UI html.

- How to use programmable `agent` in the `Engine`
- How `agent`s interact from outside asynchronously.

The `wall` is just write and update a single message.

## `fileuploader` example

The [`fileuploader` example](fileuploader) uses `orb` storage from 
inside the `agent`.

- How `agent`s manage states as DOM documents
- How `agent`s interact with inside space

## `w3cnews` example

The [`w3cnews` example](w3cnews) binds the http/s space for
accessing web resource from the `agent`.
It just get ATOM/XML feeds then access with `metadata` registered in 
the `Engine` at `run.js`.

- How `agent`s use external information via http
- How to define `metadata`
- How to use DOM subtree as template

## `hackernews` example

The [`hackernews` example](hackernews) is similar to the `w3cnews` example
except it defines `metadata` in the `agent`.

- How to define `metadata` in `agent`
- How to process external hyperlinked resources recursively

## `fileuploader2` example

The [`fileuploader2` example](fileuploader2) is 
the first multiple `agent` example.
The "get" `agent` is a proxy only tunneling GET access to 
its private `orb` storage.

- How to use multiple `agent`s
- How to use space URI mapping for management accesses

## `statuses` example

The [`statuses` example](statuses) is a lifelog stream application
that communicates browser-side code and the `agent` with paged links.
The page passed from the `agent` includes "refresh" and "backward" links.
The browser-side code uses the links to update its view.

- How to manipulate list of hyperlinks

## `timeline` example

The [`timeline` example](timeline) extends the `statuses` example
with multiple followers.

It has two `agent` "statuses" and "timeline".
The "statuses" `agent` is almost the same as the `statuses` example
except with an added "reblog" feature.
The "timeline" `agent` mix the multiple "statuses" links in a single link list
for the browser-side code.

- How to manipulate list of hyperlinks between `agent`s

Note that the `streamer.js` in both `agent`s and browser side are 
an abstraction layer
for programming with same event driven style to manipulate the hyperlinks.

## `locker` example

The [`locker` example](locker) is a multiple peer example 
for access control with (builtin) public-key cryptography in `agent`.

The "person" peer has a key pair to sign actions.
The "house" peer check the action with registered public keys
to update its state (that includes a public key list).

- How to use public-key cryptography in `agent`

## `hosting` example

The [`hosting` example](hosting) is a simple example that emulates 
an app registered store and an app running hosts.

The "store" peer is a static web site that has 
a list of "app" as a app descriptor `inst.json` 
with all files  related the `agent`s.
The "host" peer manages `inst.json` URLs of each "app"
to run as the sub `engine` to access browsers.

- How to use sub `engine`s in `agent`

Note that the system of sub `engine`s is `engine`s mapped in a parent `engine`.
It calls `GalaxyField` as a source code, and the feature in `agent` named
`inst` to simply launch with a descriptor.
It is important that the parent mapped URIs are not the root of the sub-engines,
that is similar as `WebGate` mapped URI space.
So that the private URI space may exist in each sub `engines`.

## `unittest` example

The [`unittest` example](unittest) runs unit tests of the libraries
for `agent`s.
The [`agent` HTML](unittest/src/unittest.html) loads scripts such as 
the ["tap.js"](../shared/contrib/tap.js), 
["library scripts"](unittest/src/library.js), and 
["unittest scripts"](unittest/src/library-tests.js).
The `shared/contrib/tap.js` is a TAP(Test Anything Protocol) style simple unit test runner 
`agent` script.

- How to unit test `agent`

[`runtest.js`](unittest/runtest.js) will output test results to the console
that is not required to check on the browser.

## `usefusion` example

The [`usefusion` example](usefusion) is an example for 
DOM based built-in tiny template engine: ["fusion"](../shared/contrib/fusion.js).
The mapping data of the "fusion" is just "metadata" based objects
(`Entity`/`Link`) in the `Engine`.

- How to apply inner objects to a DOM tree

