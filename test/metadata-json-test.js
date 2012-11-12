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
