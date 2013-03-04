"use strict";

var anatta = require("../../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "wiki:/": {field: "file", root: "./pub/", prefix: "/"},
    }
});
anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wiki:/"}).start("8001");
