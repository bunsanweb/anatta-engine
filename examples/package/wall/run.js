"use strict";

var anatta = require("../../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "wall:/": {field: "file", root: "./pub/", prefix: "/"},
    }
});

var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wall:/"}).start("8002");
