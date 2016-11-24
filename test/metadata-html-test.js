/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");

suite("[Metadata for HTML format]");
test("Get HTML resource", function (done) {
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", prefix: "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    const uri = `file://${__dirname}/assets/doc.html`;
    const link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(entity => {
        assert.equal(entity.attr("href"), uri);
        const entries = entity.all();
        assert.equal(entries[0].href(), "http://taro.com/");
    }).then(done, done);
});
test("Get HTML resource includes relative href", function (done) {
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", prefix: "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["text/html"] = anatta.metadata.html;
    
    const uri = `file://${__dirname}/assets/relhref/doc.html`;
    const link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(entity => {
        assert.equal(entity.attr("href"), uri);
        const entries = entity.all();
        assert.equal(
            entries[0].href(), `file://${__dirname}/assets/relhref/taro/`);
    }).then(done, done);
});
