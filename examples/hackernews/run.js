"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json",
    },
    space: {
        "http:": {field: "web"},
        "https:": {field: "web"},
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "root:/": {field: "file", root: "./pub/", prefix: "/"},
        "root:/agent/": {field: "agent", uri: "file:/index.html"},
    }
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");
