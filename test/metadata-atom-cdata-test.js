"use strict";

const assert = require("assert");

suite("[Metadata for Atom format]");
test("Get Atom resource", function (done) {
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", "prefix": "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    engine.porter.map["application/atom+xml"] = anatta.metadata.atom;
    engine.glossary.add(anatta.termset.desc.create({
        "content-type": "application/atom+xml",
        link: {
            title: {selector: "entry > title", value: "textContent"},
            summary: {selector: "entry > summary", value: "textContent"},
        },
    }));
    
    const uri = 'file:assets/cdata.atom';
    const link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(entity => {
        assert.equal(entity.attr("href"), uri);
        const entries = entity.all();
        assert.equal(entries[0].attr("title"), "Hello");
        assert.equal(entries[0].attr("summary"), "World");
    }).then(done, done);
});
