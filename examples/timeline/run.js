"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json"
    },
    space: {
        "http:": {field: "web"},
        "https:": {field: "web"},
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "root:/statuses/": {field: "agent", uri: "file:/statuses.html"},
        "root:/timeline/": {field: "agent", uri: "file:/timeline.html"},
        "root:/orb": {field: "orb"},
        "root:/": {field: "file", root: "./pub/", prefix: "/"}
    }
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.argv[2] || process.env.PORT || "8000");
