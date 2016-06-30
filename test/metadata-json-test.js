/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");

suite("[Metadata for JSON format]");
test("Get JSON resource", function (done) {
    this.timeout(5000); // WORKAROUND: too late to finish only first time
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("data", "data:", anatta.space.data.DataField());
    engine.porter.map["application/json"] = anatta.metadata.json;
    
    const body = '{"name": "taro"}';
    const contentType = "application/json";
    const uri = `data:${contentType},${encodeURI(body)}`;
    const link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(entity => {
        assert.equal(entity.attr("href"), uri);
        assert.equal(entity.attr("content-type"), contentType);
        assert.equal(entity.attr("body"), body);
    }).then(done, done);
});


test("Get JSON resource from relative link", function (done) {
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", prefix: "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    
    const uri = "file:assets/linker.json";
    const link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(entity => {
        const links = entity.all();
        assert.equal(links.length, 1);
        assert.equal(links[0].href(), "file:assets/target.json");
        assert.equal(links[0].attr("href"), "target.json");
        return links[0].get();
    }).then(target => {
        assert.equal(target.attr("href"), "file:assets/target.json");
        assert.equal(target.attr("body"), '{"name": "target"}\n');
    }).then(done, done);
});

