"use strict";

const assert = require("assert");

suite("[webgate: engine as a web server]");
test("", function (done) {
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/assets/agent/", prefix: "/",
    }));
    const webField = anatta.space.web.WebField({});
    engine.space.manager.bind("http", "http:", webField);
    engine.space.manager.bind("https", "https:", webField);

    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    const myAgentField = anatta.weaver.core.AgentField({
        uri: "file:/linking.html"});
    myAgentField.agent.engine = engine;
    engine.space.manager.bind("myagent", "myagent:", myAgentField);
    
    const webgate = anatta.webgate.core.WebGate(engine.space, {
        from: "/",
        to: "myagent:/",
    });
    const port = process.env.PORT || "18000";
    webgate.start(port);
    
    
    const gateUri = engine.link({href: "http://localhost:" + port + "/"});
    gateUri.get().then(entity => {
        assert.equal(entity.attr("content-type"), "text/plain;charset=utf-8");
        assert.equal(entity.response.text(), "Hello from Linked Script!");
        webgate.stop();
    }).then(done, done);
});

test("http request.origin().uri is absolute URI", function (done) {
    const anatta = require("../anatta");

    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("http", "http:", anatta.space.web.WebField());
    engine.porter.map["application/json"] = anatta.metadata.json;

    const port = process.env.PORT || "8000";
    const originalUri = `http://localhost:${port}/`;
    const AssertField = class {
        access(request) {
            assert.equal(request.origin().href, originalUri);
            return new Promise(f => f([
                request,
                anatta.space.core.Response(
                    "200", {"content-type": "text/plain"}, ""),
            ]));
        };
    };
    
    engine.space.manager.bind("inner-uri", "inner-uri:", new AssertField());
    const webgate = anatta.webgate.core.WebGate(engine.space, {
        from: "/",
        to: "inner-uri:/",
    });
    webgate.start(port);
    
    engine.link({href: originalUri}).get().then(entity => {
        webgate.stop();
    }).then(done, done);
});

test("https request.origin().uri is absolute URI", function (done) {
    const anatta = require("../anatta");
    const fs = require("fs");

    const engine = anatta.engine.core.Engine();
    const webField = anatta.space.web.WebField();
    engine.space.manager.bind("https", "https:", anatta.space.web.WebField());
    engine.porter.map["application/json"] = anatta.metadata.json;

    const port = process.env.PORT || "8000";
    const originalUri = `https://localhost:${port}/`;
    const AssertField = class {
        access(request) {
            assert.equal(request.origin().href, originalUri);
            return new Promise(f => f([
                request,
                anatta.space.core.Response("200", {
                    "content-type": "text/plain"}, ""),
            ]));
        };
    };
    
    engine.space.manager.bind("inner-uri", "inner-uri:", new AssertField());
    const webgate = anatta.webgate.core.WebGate(engine.space, {
        from: "/",
        to: "inner-uri:/",
    });
    webgate.start(port, "localhost", {
        key: fs.readFileSync("./test/assets/https/privatekey.pem"),
        cert: fs.readFileSync("./test/assets/https/certificate.pem")
    });
    
    engine.link({href: originalUri}).get().then(entity => {
        webgate.stop();
    }).then(done, done);
});

