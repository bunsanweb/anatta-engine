"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.core.Engine();
var orb = anatta.orb.core.OrbField();
engine.space.manager.bind("orb", "wiki:/orb", orb);
var file = anatta.space.file.FileField({root: "./ui/", prefix: "/"});
engine.space.manager.bind("file", "wiki:", file);

var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "wiki:/"});
gate.start(process.env.PORT || "8000");
