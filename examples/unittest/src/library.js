// sync
var join = function (base, href) {
    return anatta.builtin.url.resolve(base, href);
};

// async
var get = function (uri) {
    return anatta.engine.link({href: uri}).get();
};
