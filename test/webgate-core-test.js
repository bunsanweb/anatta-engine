"use strict";

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

test("get original URI from request", function (done) {
    var anatta = require("../anatta");
    var q = require("q");

    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("http", "http:", anatta.space.web.WebField());
    engine.porter.map["application/json"] = anatta.metadata.json;

    var port = process.env.PORT || "8000";
    var originalUri = "http://localhost:" + port + "/";
    var AssertField = function AssertField () {
        return Object.create({
            access: function (request) {
                assert.equal(request.origin().uri, originalUri);
                var d = q.defer();
                var response = anatta.space.core.Response("200",
                    {"content-type": "text/plain"}, "");
                d.resolve([request, response]);
                return d.promise;
            }
        });
    };
    
    engine.space.manager.bind("inner-uri", "inner-uri:", AssertField());
    var webgate = anatta.webgate.core.WebGate(engine.space, {
        from: "/",
        to: "inner-uri:/",
    });
    webgate.start(port);
    
    engine.link({href: originalUri}).get().then(function (entity) {
        webgate.stop();
    }).then(done, done);
});

test("get original URI from request https", function (done) {
    var anatta = require("../anatta");
    var fs = require("fs");
    var q = require("q");

    var engine = anatta.engine.core.Engine();
    var webField = anatta.space.web.WebField();
    engine.space.manager.bind("http", "http:", webField);
    engine.space.manager.bind("https", "https:", webField);
    engine.porter.map["application/json"] = anatta.metadata.json;

    var port = process.env.PORT || "8000";
    var originalUri = "https://localhost:" + port + "/";
    var AssertField = function AssertField () {
        return Object.create({
            access: function (request) {
                assert.equal(request.origin().uri, originalUri);
                var d = q.defer();
                var response = anatta.space.core.Response("200",
                    {"content-type": "text/plain"}, "");
                d.resolve([request, response]);
                return d.promise;
            }
        });
    };
    
    engine.space.manager.bind("inner-uri", "inner-uri:", AssertField());
    var webgate = anatta.webgate.core.WebGate(engine.space, {
        from: "/",
        to: "inner-uri:/",
    });
    webgate.start(port, "localhost", {
        key: fs.readFileSync("./test/assets/https/privatekey.pem"),
        cert: fs.readFileSync("./test/assets/https/certificate.pem")
    });
    
    engine.link({href: originalUri}).get().then(function (entity) {
        webgate.stop();
    }).then(done, done);
});

