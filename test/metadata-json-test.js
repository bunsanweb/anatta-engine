var assert = require("assert");

suite("[Metadata for JSON format]");
test("Get JSON resource", function (done) {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("data", "data:", anatta.space.data.DataField());
    engine.porter.map["application/json"] = anatta.metadata.json;
    
    var uri = 'data:application/json,{"name": "taro"}'
    var link = engine.link({href: uri});
    assert.equal(link.href(), uri);
    link.get().then(function (entity) {
        assert.equal(entity.attr("name"), "taro");
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
        assert.equal(entity.attr("name"), "linker");
        var links = entity.all();
        assert.equal(links.length, 1);
        assert.equal(links[0].attr("name"), "target1");
        assert.equal(links[0].href(), "file:assets/target.json");
        assert.equal(links[0].attr("href"), "target.json");
        return links[0].get();
    }).then(function (target) {
        assert.equal(target.attr("name"), "target");
    }).then(done, done);
});

