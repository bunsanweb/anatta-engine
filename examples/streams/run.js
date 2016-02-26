"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
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
        "src:/streamer/": {field: "file", root: anatta.shared("./streamer/"),
                           prefix: "/streamer/"},
        "orb:": {field: "orb", cache: false},
        "root:/": {field: "file", root: "./ui/", prefix: "/"},
        "root:/streamer/": {field: "file", root: anatta.shared("./streamer/"),
                            prefix: "/streamer/"},
        "root:/streams": {field: "agent", uri: "src:/index.html"}
    }
});

const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");
