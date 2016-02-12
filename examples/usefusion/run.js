"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "application/json": "json",
        "text/html": "html",
    },
    space: {
        "src:": {field: "file", root: "./src/", prefix: "/"},
        "src:/shared": {field: "file", root: anatta.shared(),
                        prefix: "/shared/"},
        "module:/": {field: "agent", uri: "src:/index.html"},
    },
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "module:/"});
gate.start(process.env.PORT || "8000");
