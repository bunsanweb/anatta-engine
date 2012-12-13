var assert = require("assert");

suite("[webgate: engine as a web server]");
test("", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/assets/agent/", prefix: "/",
    }));
    var webField = anatta.space.web.WebField({});
    engine.space.manager.bind("http", "http:", webField);
    engine.space.manager.bind("https", "https:", webField);

    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var myAgentField = anatta.weaver.core.AgentField({
        uri: "file:/linking.html"});
    myAgentField.agent.engine = engine;
    engine.space.manager.bind("myagent", "myagent:", myAgentField);
    
    var webgate = anatta.webgate.core.WebGate(engine.space, {
        from: "/",
        to: "myagent:/",
    });
    var port = process.env.PORT || "8000";
    webgate.start(port);
    
    
    var gateUri = engine.link({href: "http://localhost:" + port + "/"});
    gateUri.get().then(function (entity) {
        assert.equal(entity.attr("content-type"), "text/plain;charset=utf-8");
        assert.equal(entity.response.body.toString(), 
                     "Hello from Linked Script!");
        webgate.stop();
    }).then(done, done);

});
