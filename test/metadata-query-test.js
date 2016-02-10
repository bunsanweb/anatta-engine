"use strict";

const assert = require("assert");

suite("[Metadata query language]");
test("find by value", function (done) {
    const engine = newEngine();
    const uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(entity => {
        const links = entity.all();
        assert.equal(links.length, 4);
        assert.equal(links[0].attr("rel"), "child");
        assert.equal(links[1].attr("rel"), "grandchild");
        assert.equal(links[2].attr("rel"), "child");
        assert.equal(links[3].attr("rel"), "");
        // find by attribute and value
        const selected = entity.find({rel: "child"});
        assert.equal(selected.length, 2);
        assert.equal(selected[0].attr("name"), "first");
        assert.equal(selected[1].attr("name"), "third");
        // find first
        const one = entity.first({rel: "grandchild"});
        assert.equal(one.attr("name"), "second");
    }).then(done, done);
});


test("select by value as list", function (done) {
    const engine = newEngine();
    const uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child node", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(entity => {
        // find by attribute and value as list
        const every = entity.find({rel: []});
        assert.equal(every.length, 4);
        const single = entity.find({rel: ["child"]});
        assert.equal(single.length, 2);
        assert.equal(single[0].attr("name"), "first");
        assert.equal(single[1].attr("name"), "third");
        const comb = entity.find({rel: ["child", "node"]});
        assert.equal(comb.length, 1);
        assert.equal(comb[0].attr("name"), "first");
    }).then(done, done);
});

test("select by existence", function (done) {
    const engine = newEngine();
    const uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child node", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(entity => {
        // find by attribute as its existence
        const rels = entity.find({rel: true});
        assert.equal(rels.length, 3);
        assert.equal(rels[0].attr("name"), "first");
        assert.equal(rels[1].attr("name"), "second");
        assert.equal(rels[2].attr("name"), "third");
        const norel = entity.find({rel: false});
        assert.equal(norel.length, 1);
        assert.equal(norel[0].attr("name"), "fourth");
    }).then(done, done);
});


test("select by multiple condition", function (done) {
    const engine = newEngine();
    const uri = dataUri({
        name: "taro",
        first: {href: "/first", rel: "child node", name: "first"},
        second: {href: "/second", rel: "grandchild", name: "second"},
        third: {href: "/third", rel: "child", name: "third"},
        fourth: {href: "/fourth", name: "fourth"},
    });
    engine.link({href: uri}).get().then(entity => {
        // find by multiple attribute
        const second = entity.find({rel: true, name: "second"});
        assert.equal(second.length, 1);
        assert.equal(second[0].attr("name"), "second");
        const empty = entity.find({rel: true, name: "fourth"});
        assert.equal(empty.length, 0);
    }).then(done, done);
});

// utils
const newEngine = () => {
    const anatta = require("../anatta");
    const engine = anatta.engine.core.Engine();
    engine.space.manager.bind("data", "data:", anatta.space.data.DataField());
    engine.porter.map["application/json"] = anatta.metadata.json;
    const termset = {
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
const dataUri = (json) => {
    const body = JSON.stringify(json);
    const contentType = "application/json";
    return `data:${contentType},${encodeURI(body)}`;
};
