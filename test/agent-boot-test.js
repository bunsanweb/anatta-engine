var assert = require("assert");

suite("[Agent booting process]");
test("boot empty agent", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/assets/agent/", prefix: "/",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var myAgentField = anatta.weaver.core.AgentField({
        uri: "file:/empty.html"});
    myAgentField.agent.engine = engine;
    engine.space.manager.bind("myagent", "myagent:", myAgentField);
    
    var baseUri = engine.link({href: "myagent:/"});
    baseUri.get().then(function (entity) {
        assert.equal(entity.attr("content-type"), "text/html;charset=utf-8");
        assert.equal(entity.html.body.textContent, "\nHello World!\n");
    }).then(done, done);
});

test("boot embeded script agent", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/assets/agent/", prefix: "/",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var myAgentField = anatta.weaver.core.AgentField({
        uri: "file:/embeded.html"});
    myAgentField.agent.engine = engine;
    engine.space.manager.bind("myagent", "myagent:", myAgentField);
    
    var baseUri = engine.link({href: "myagent:/"});
    baseUri.get().then(function (entity) {
        assert.equal(entity.attr("content-type"), "text/plain;charset=utf-8");
        assert.equal(entity.response.body.toString(), "Hello from Script!");
    }).then(done, done);
});

