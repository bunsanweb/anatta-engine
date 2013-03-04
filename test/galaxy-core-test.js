"use strict";

var assert = require("assert");

suite("[Galaxy field as a sub engine]");
test("Connect to sub engine as a galaxy", function (done) {
    var anatta = require("../anatta");
    
    // sub engien for agent resource
    var sub = anatta.engine.core.Engine();
    sub.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/assets/agent/", prefix: "/",
    }));
    sub.porter.map["application/json"] = anatta.metadata.json;
    sub.porter.map["text/html"] = anatta.metadata.html;
    var agent = anatta.weaver.core.AgentField({uri: "file:/linking.html"});
    agent.agent.engine = sub;
    sub.space.manager.bind("agent", "module:", agent);
    
    // global engine include sub agents
    var engine = anatta.engine.core.Engine();
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    var galaxy = anatta.galaxy.core.GalaxyField({
        from: "me:/sub/", to: "module:/"});
    galaxy.engine = sub;
    engine.space.manager.bind("sub-galaxy", "me:/sub/", galaxy);
    
    var uri = engine.link({href: "me:/sub/"});
    uri.get().then(function (entity) {
        assert.equal(entity.attr("content-type"), "text/plain;charset=utf-8");
        assert.equal(entity.response.text(), "Hello from Linked Script!");
    }).then(done, done);
});
