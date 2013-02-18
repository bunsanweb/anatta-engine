"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "application/json": "json",
        "text/html": "html",
    },
    space: {
        "http:": {field: "web"},
        "src:": {field: "file", root: "./src/", prefix: "/"},
        "module:/": {field: "agent", uri: "src:/index.html"},
        "module:/unittest/": {field: "agent", uri: "src:/unittest.html"},
    },
});

engine.link({href: "module:/unittest/"}).get().then(function (entity) {
    console.log(entity.attr("body"));
});
