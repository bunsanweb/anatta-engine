"use strict";

var assert = require("assert");

suite("[Metadata for HTML format]");
test("Get HTML resource", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", "prefix": "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var uri = 'file:assets/doc.html';
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        assert.equal(entity.attr("href"), uri);
        var entries = entity.all();
        assert.equal(entries[0].href(), "http://taro.com/");
    }).then(done, done);
});
test("Get HTML resource includes relative href", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", "prefix": "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var uri = 'file:assets/relhref/doc.html';
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        assert.equal(entity.attr("href"), uri);
        var entries = entity.all();
        assert.equal(entries[0].href(), "file:///assets/relhref/taro/");
    }).then(done, done);
});
