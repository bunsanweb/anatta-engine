"use strict";

var assert = require("assert");

suite("[engine builder]");
test("build as generic config", function () {
    var anatta = require("../anatta");
    
    var config = {
        type: "generic",
        porter: {
            "text/html": "html",
            "application/json": "json",
        },
        space: {
            "http:" : {field: "web"},
            "https:" : {field: "web"},
            "file:/" : {field: "file", 
                         path: "./test/assets/agent/", prefix: "/"},
            "orb:": {field: "orb"},
            "myagent:": {field: "agent", uri: "file:/empty.html"},
            "me:": {field: "galaxy", from: "me:", to: "orb:", engine: {
                porter: {
                    "text/html": "html",
                    "application/json": "json",
                },
                space: {
                    "private:": {field: "orb"},
                },
            }},
        },
    };
    var engine = anatta.engine.builder.engine(config);
    
    assert.ok(engine.porter.map["text/html"]);
    assert.ok(engine.porter.map["application/json"]);
    assert.ok(engine.space.manager.fields["web|http:"].field);
    assert.ok(engine.space.manager.fields["web|https:"].field);
    assert.ok(engine.space.manager.fields["file|file:/"].field);
    assert.ok(engine.space.manager.fields["orb|orb:"].field);
    assert.ok(engine.space.manager.fields["agent|myagent:"].field);
    assert.ok(engine.space.manager.fields["galaxy|me:"].field);
    assert.ok(engine.space.manager.fields["galaxy|me:"].field.
              engine.space.manager.fields["orb|private:"].field);
});


test("build as simple config", function () {
    var anatta = require("../anatta");
    
    var config = {
        type: "simple",
        porter: {
            "text/html": "html",
            "application/json": "json",
        },
        space: {
            web: ["https:", "http:"],
            file: {"file:/": "./test/assets/agent/"},
            orb: ["orb:"],
            agent: {"myagent:": "file:empty.html"},
            galaxy: {"me:": {
                to: "orb:",
                porter: {
                    "text/html": "html",
                    "application/json": "json",
                },
                space: {
                    orb: ["private:"],
                },
            }},
        },
    };
    var engine = anatta.engine.builder.engine(config);
    
    assert.ok(engine.porter.map["text/html"]);
    assert.ok(engine.porter.map["application/json"]);
    assert.ok(engine.space.manager.fields["web|http:"].field);
    assert.ok(engine.space.manager.fields["web|https:"].field);
    assert.ok(engine.space.manager.fields["file|file:/"].field);
    assert.ok(engine.space.manager.fields["orb|orb:"].field);
    assert.ok(engine.space.manager.fields["agent|myagent:"].field);
    assert.ok(engine.space.manager.fields["galaxy|me:"].field);
    assert.ok(engine.space.manager.fields["galaxy|me:"].field.
              engine.space.manager.fields["orb|private:"].field);
});
