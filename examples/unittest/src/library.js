"use strict";

// sync function for testing
var join = function (base, href) {
    return anatta.builtin.url.resolve(base, href);
};

// async function for testing
var get = function (uri) {
    return anatta.engine.link({href: uri}).get();
};
