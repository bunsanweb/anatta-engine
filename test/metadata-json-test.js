"use strict";

var assert = require("assert");

suite("[Metadata for JSON format]");
test("Get JSON resource", function (done) {
    this.timeout(5000); // WORKAROUND: too late to finish only first time
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("data", "data:", anatta.space.data.DataField());
    engine.porter.map["application/json"] = anatta.metadata.json;
    
    var body =  '{"name": "taro"}';
    var contentType = "application/json";
    var uri = 'data:' + contentType + ',' + encodeURI(body);
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        assert.equal(entity.attr("href"), uri);
        assert.equal(entity.attr("content-type"), contentType);
        assert.equal(entity.attr("body"), body);
    }).then(done, done);
});


test("Get JSON resource from relative link", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("file", "file:", anatta.space.file.FileField({
        root: "./test/", "prefix": "",
    }));
    engine.porter.map["application/json"] = anatta.metadata.json;
    
    var uri = 'file:assets/linker.json';
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        var links = entity.all();
        assert.equal(links.length, 1);
        assert.equal(links[0].href(), "file:assets/target.json");
        assert.equal(links[0].attr("href"), "target.json");
        return links[0].get();
    }).then(function (target) {
        assert.equal(target.attr("href"), "file:assets/target.json");
        assert.equal(target.attr("body"), '{"name": "target"}\n');
    }).then(done, done);
});

