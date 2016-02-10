"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "wiki:/orb": {field: "orb"},
        "wiki:": {field: "file", root: "./ui/", prefix: "/"},
    }
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wiki:/"});
gate.start(process.env.PORT || "8000");
