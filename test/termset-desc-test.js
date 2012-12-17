"use strict";

var assert = require("assert");

suite("[TermSet descriptoin]");
test("Set JSON description and use", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", prefix: "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var termset = anatta.termset.desc.create({
        name: "activity-source",
        "content-type": "text/html",
        entity: {
            title: {selector: "body h1", value: "textContent"},
            author: {selector: "[rel=author] [href]", value: "href"},
            updated: {selector: "[rel=updated]", value: "textContent"},
        },
    });
    engine.glossary.add(termset);
    
    var uri = 'file:assets/doc.html';
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        assert.equal(entity.attr("title"), "Title");
        assert.equal(entity.attr("updated"), "2012/11/30");
        assert.equal(entity.attr("author"), "http://taro.com/");
    }).then(done, done);
});
