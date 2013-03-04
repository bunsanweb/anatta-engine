"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json",
    },
    space: {
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "root:/": {field: "file", root: "./pub/", prefix: "/"},
        "root:/stream/": {field: "agent", uri: "file:/index.html"},
        "root:/orb": {field: "orb"},
    }
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");
