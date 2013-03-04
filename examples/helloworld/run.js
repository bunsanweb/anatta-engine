"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "file:": {field: "file", root: "./pub/", prefix: "/"}
    }
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "file:/"});
gate.start(process.env.PORT || "8000");
