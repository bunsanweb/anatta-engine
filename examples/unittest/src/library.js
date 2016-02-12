"use strict";

// sync function for testing
const join = (base, href) => anatta.builtin.url.resolve(base, href);

// async function for testing
const get = (uri) => anatta.engine.link({href: uri}).get();
