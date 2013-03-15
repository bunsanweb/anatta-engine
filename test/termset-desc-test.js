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
        
        // builtin is also available
        assert.equal(entity.attr("href"), uri);
        var entries = entity.all();
        assert.equal(entries[0].attr("href"), "http://taro.com/");
    }).then(done, done);
});

test("Set link description in JSON", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", prefix: "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    var termset = anatta.termset.desc.create({
        name: "news-index",
        "content-type": "text/html",
        entity: {
            title: {selector: "body h1", value: "textContent"},
            author: {selector: "[rel=author] [href]", value: "href"},
            updated: {selector: "[rel=updated]", value: "textContent"},
            link: {selector: "main > article"}, // re-define link unit
        },
        link: {
            title: {selector: "h1", value: "textContent"},
            href: {selector: "a", value: "href"},
            content: {selector: ".content", value: "innerHTML"},
        },
    });
    engine.glossary.add(termset);
    
    var uri = 'file:assets/links.html';
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        assert.equal(entity.attr("title"), "News Index");
        assert.equal(entity.attr("updated"), "2012/11/30");
        assert.equal(entity.attr("author"), "http://taro.com/");
        
        // builtin is also available
        assert.equal(entity.attr("href"), uri);
        var entries = entity.all();
        assert.equal(entries[0].attr("title"), "news A");
        assert.equal(entries[0].attr("href"), "http://example.com/news/1");
        assert.equal(entries[0].attr("content"), "News Release ...");
        assert.equal(entries[1].attr("title"), "news B");
        assert.equal(entries[1].attr("href"), "http://example.com/news/2");
        assert.equal(entries[1].attr("content"), "A vs B");
    }).then(done, done);
});
