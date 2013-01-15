"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.core.Engine();
var file = anatta.space.file.FileField({root: "./pub/", prefix: "/"});
engine.space.manager.bind("file", "file:", file);

var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "file:/"});
gate.start(process.env.PORT || "8000");
