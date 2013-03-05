"use strict";

var anatta = require("../../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "wall:/": {field: "file", root: "./pub/", prefix: "/"},
    }
});

var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wall:/"});
gate.start(process.argv[2] || process.env.PORT || "8002");
