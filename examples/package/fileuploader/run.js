"use strict";

var anatta = require("../../../anatta");

var engine = anatta.engine.builder.engine({
    type: "generic",
    space: {
        "root:/": {field: "file", root: "./pub/", prefix: "/"},
    }
});
anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"}).start("8003");
