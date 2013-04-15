"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json",
        "application/atom+xml": "atom",
    },
    space: {
        "src:": {field: "file", root: "./streams/", prefix: "/"},
        "src:/shared/": {field: "file", root: anatta.shared(),
                         prefix: "/shared/"},
        "orb:": {field: "orb", cache: false},
        "root:/": {field: "file", root: "./ui/", prefix: "/"},
        "root:/streams": {field: "agent", uri: "src:/index.html"},
    },
});

var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");
