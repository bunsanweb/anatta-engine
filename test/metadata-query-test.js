"use strict";

var assert = require("assert");

suite("[Metadata query language]");
test("find by value", function (done) {
    var engine = newEngine();
    var uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(function (entity) {
        var links = entity.all();
        assert.equal(links.length, 4);
        assert.equal(links[0].attr("rel"), "child");
        assert.equal(links[1].attr("rel"), "grandchild");
        assert.equal(links[2].attr("rel"), "child");
        assert.equal(links[3].attr("rel"), "");
        // find by attribute and value
        var selected = entity.find({rel: "child"});
        assert.equal(selected.length, 2);
        assert.equal(selected[0].attr("name"), "first");
        assert.equal(selected[1].attr("name"), "third");
        // find first
        var one = entity.first({rel: "grandchild"});
        assert.equal(one.attr("name"), "second");
    }).then(done, done);
});


test("select by value as list", function (done) {
    var engine = newEngine();
    var uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child node", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(function (entity) {
        // find by attribute and value as list
        var every = entity.find({rel: []});
        assert.equal(every.length, 4);
        var single = entity.find({rel: ["child"]});
        assert.equal(single.length, 2);
        assert.equal(single[0].attr("name"), "first");
        assert.equal(single[1].attr("name"), "third");
        var comb = entity.find({rel: ["child", "node"]});
        assert.equal(comb.length, 1);
        assert.equal(comb[0].attr("name"), "first");
    }).then(done, done);
});

test("select by existence", function (done) {
    var engine = newEngine();
    var uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child node", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(function (entity) {
        // find by attribute as its existence
        var rels = entity.find({rel: true});
        assert.equal(rels.length, 3);
        assert.equal(rels[0].attr("name"), "first");
        assert.equal(rels[1].attr("name"), "second");
        assert.equal(rels[2].attr("name"), "third");
        var norel = entity.find({rel: false});
        assert.equal(norel.length, 1);
        assert.equal(norel[0].attr("name"), "fourth");
    }).then(done, done);
});


test("select by multiple condition", function (done) {
    var engine = newEngine();
    var uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child node", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(function (entity) {
        // find by multiple attribute
        var second = entity.find({rel: true, name: "second"});
        assert.equal(second.length, 1);
        assert.equal(second[0].attr("name"), "second");
        var empty = entity.find({rel: true, name: "fourth"});
        assert.equal(empty.length, 0);
    }).then(done, done);
});

// utils
var newEngine = function () {
    var anatta = require("../anatta");
    var engine = anatta.engine.core.Engine();
    engine.space.manager.bind("data", "data:", anatta.space.data.DataField());
    engine.porter.map["application/json"] = anatta.metadata.json;
    var termset = {
        name: "for test",
        "content-type": "application/json",
        link: {
            rel: {selector: "rel"},
            name: {selector: "name"},
        },
    };
    engine.glossary.add(anatta.termset.desc.create(termset));
    return engine;
};
var dataUri = function (json) {
    var body = JSON.stringify(json);
    var contentType = "application/json";
    return 'data:' + contentType + ',' + encodeURI(body);
};
