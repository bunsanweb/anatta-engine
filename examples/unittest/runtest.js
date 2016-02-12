"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "application/json": "json",
        "text/html": "html",
    },
    space: {
        "http:": {field: "web"},
        "src:": {field: "file", root: "./src/", prefix: "/"},
        "src:/shared/": {field: "file", root: anatta.shared(),
                         prefix: "/shared/"},
        "module:/": {field: "agent", uri: "src:/index.html"},
        "module:/unittest/": {field: "agent", uri: "src:/unittest.html"},
    },
});

engine.link({href: "module:/unittest/"}).get().then(
    entity => console.log(entity.attr("body")));

