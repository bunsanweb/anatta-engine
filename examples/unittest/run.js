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
        "src:/shared": {field: "file", root: anatta.shared(),
                        prefix: "/shared/"},
        "module:/": {field: "agent", uri: "src:/index.html"},
        "module:/unittest/": {field: "agent", uri: "src:/unittest.html"},
    },
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "module:/"});
gate.start(process.env.PORT || "8000");
