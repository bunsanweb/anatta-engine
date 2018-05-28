# Anatta Engine

"anatta-engine" is a programming environment that applies
the **browser programming methods for Web Resource(URI)s**
to the Web Resources themselves:

- Hyperlinking of URIs as first-class objects
- Programs resolve hyperlinks as the data includes the next hyperlinks
- Programs are also revealed by resolving URIs

The `Engine` manages the URI `Space` that contains
web URIs(`"http"`, `"https"`), files(`"file`), 
storage(`"orb"` an abstract writable cache), 
and the programs using the engine itself.

The `Space` can redirect between the URIs to arrange resources and map them.
As for the programs, program-mapped URI are used as a libraries.
By then putting The `Engine` into a `WebGate` gateway to 
reveal the part of the arranged `space` acts as a HTTP/S Web server.
It can also be connected by standard browsers. 
And It can also be connected from remote host seamlessly through the `Engine`s.

To realize this concept, several design decisions exist in the "anatta-engine" including:

- HTML as a primary data format
- HTML with JavaScript as the program format
- ...

## Setup the repository

The "anatta-engine" runs directly on "node.js" with no native packages.
You can set it up with `npm install`:

```bash
$ git clone https://github.com/anatta-project/anatta-engine
$ cd anatta-engine
$ npm install
```

Then you can run the example programs in the [`examples`](./examples/) directory.

For more details on the examples, see:

- [examples/readme.md](examples/readme.md)

## About the source code

The source code is written with ECMAScript 2015 without `modules`.
Several node.js external packages are used inside, 
but are not revealed outside except standard `DOM` objects 
(in "jsdom" and "xmldom").

In the "anatta-engine", roles of script files exist as:

- programs formed `Engine`
- programs run on `Engine`
- programs run on browsers

The first one is a main library of the "anatta-engine" 
in the ["engine"](./engine/) directory.
Use them for starting the engine as in the example's 
[`run.js` files](examples/wall/run.js).

The second one is a main part of the more complex examples;
e.g. [wall example's wall/script.js](examples/wall/wall/script.js).
The third one is also in the examples usually stored 
at `pub` directories; 
e.g. [wall example's pub/script.js](examples/wall/pub/script.js).
The second one and the third one is almost same style of programming.
So the shared library loading with "script" tag for them are same code
in [`shared`](./shared)  directory.

For further details of the design of source code, see:

- [doc/design.md](doc/design.md)

