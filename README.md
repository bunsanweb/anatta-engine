# Anatta Engine

"anatta-engine" is a programming environment that applies
the programming ways in browsers for the Web Resource(URI)s
to the Web Resources theirself:

- Hyperlink of URI as first-class object
- Programs resolve hyperlinks as the data includes next hyperlinks
- Programs are also revealed via resolving URIs

The `Engine` manages the URI `Space` that contains
web URIs(`"http"`, `"https"`), files(`"file:`), 
storages(`"orb"` as abstract writable cache),  
and the programs using the engine itself.

The `Space` can redirect between the URIs as mapping to arrange the resources.
As for the programs, programs mapped URI are used as a libraries.
And then, puting The `Engine` into a `WebGate` gateway to 
reveal the part of the arranged `space` becomes as a HTTP/S Web server.
It can also be connected by usual browsers. 
And It can be connected by the `Engine`s from remote host seamless ways.

For the concept, several design decisions exist in the "anatta-engine" as:

- HTML as a primary data format
- HTML with JavaScript for the program format
- ...

## Setup

The "anatta-engine" runs on "node.js" with no native packages directly.
You can set up with `npm install`:

```bash
$ git clone https://github.com/anatta-project/anatta-engine
$ cd anatta-engine
$ npm install
```

Then you can run example programs in the [`examples`](./examples/) directory.

For details of the examples, see:

- [examples/readme.md](examples/readme.md)

## About the source codes

The source codes are written with the ECMAScript 2015 without `modules`.
Several node.js external packages are used inside, 
but are not revealed outside except standard `DOM` objects 
(in "jsdom" and "xmldom").

In the "anatta-engine", roles of script files exist as:

- programs formed `Engine`
- programs run on `Engine`
- programs run on browsers

The first one is a main library of "anatta-engine" 
in the ["engine"](./engine/) directory.
Using them for starting the engine as the example's `run.js` files.

The scond one is a main part of the complex examples.
The third one is also in the examples usually stored at `pub` directories.
The second one and the third one is almost same style of programming.
So the shared library loading with "script" tag for them are same code
in [`shared`](./shared)  directory.

For details of the design of source codes, see:

- [docs/design.md](docs/design.md)

