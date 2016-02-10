"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "file:": {field: "file", root: "./pub/", prefix: "/"}
    }
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "file:/"});
gate.start(process.env.PORT || "8000");
