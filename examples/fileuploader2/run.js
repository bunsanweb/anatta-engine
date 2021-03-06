"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json",
    },
    space: {
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "root:/": {field: "file", root: "./pub/", prefix: "/"},
        "root:/files": {field: "agent", uri: "file:/index.html"},
        "root:/orb": {field: "agent", uri: "file:/get.html"},
        "private:/orb": {field: "orb"},
    }
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");
