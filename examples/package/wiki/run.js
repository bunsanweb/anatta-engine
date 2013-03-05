"use strict";

var anatta = require("../../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "wiki:/": {field: "file", root: "./pub/", prefix: "/"},
    }
});
anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wiki:/"});
gate.start(process.argv[2] || process.env.PORT || "8001");
