/*global anatta*/
"use strict";

// sync function for testing
window.join = (base, href) => anatta.builtin.url.resolve(base, href);

// async function for testing
window.get = (uri) => anatta.engine.link({href: uri}).get();
