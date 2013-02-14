"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "wiki:/orb": {field: "orb"},
        "wiki:": {field: "file", root: "./ui/", prefix: "/"},
    }
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wiki:/"});
gate.start(process.env.PORT || "8000");
