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
    
    const uri = 'file:assets/feed.atom';
    const link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(entity =>  {
        assert.equal(entity.attr("href"), uri);
        const entries = entity.all();
        //console.log(entries[0].attr("body"))
        assert.equal(entries[0].attr("href"), "file:assets/article1.atom");
    }).then(done, done);
});
