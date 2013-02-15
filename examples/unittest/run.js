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
        "file:": {field: "file", root: "./src/", prefix: "/"},
        "module:/": {field: "agent", uri: "file:/index.html"},
        "module:/unittest/": {field: "agent", uri: "file:/unittest.html"},
    },
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "module:/"});
gate.start(process.env.PORT || "8000");
