"use strict";

var anatta = require("../../anatta");

var engine = anatta.engine.core.Engine();
engine.porter.map["text/html"] = anatta.metadata.html;
engine.porter.map["application/json"] = anatta.metadata.json;

engine.space.manager.bind("fileAgent", "file:", anatta.space.file.FileField({
    root: "./agent/", prefix: "/"}));
var agentField = anatta.weaver.core.AgentField({
    uri: "file:/index.html"});
agentField.agent.engine = engine;
engine.space.manager.bind("agent", "root:/stream/", agentField);

engine.space.manager.bind("orb", "root:/orb", anatta.orb.core.OrbField());

engine.space.manager.bind("filePub", "root:/", anatta.space.file.FileField({
    root: "./pub/", prefix: "/"}));

var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");