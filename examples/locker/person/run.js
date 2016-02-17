"use strict";

const anatta = require("../../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json"
    },
    space: {
        "http:": {field: "web"},
        "https:": {field: "web"},
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "lib:/": {field: "file", root: "../lib/", prefix: "/"},
        "root:/agent": {field: "agent", uri: "file:/agent.html"},
        "root:/pubkey": {field: "agent", uri: "file:/keybox.html"},
        "root:/": {field: "file", root: "./pub/", prefix: "/"},
        "root:/message": {field: "file", root: "./pub/", prefix: "/"}
    }
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.argv[2] || process.env.PORT || "8001");
