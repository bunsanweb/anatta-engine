"use strict";

var assert = require("assert");

suite("[shared/tap]");
test("self test as tap agent", function (done) {
    var anatta = require("../anatta");

    var engine = anatta.engine.builder.engine({
        type: "generic",
        porter: {
            "application/json": "json",
            "text/html": "html",
        },
        space: {
            "src:": {field: "file", root: "./test/assets/tap/", prefix: "/"},
            "src:/shared/": {field: "file", root: anatta.shared(),
                             prefix: "/shared/"},
            "module:/unittest/": {field: "agent", uri: "src:/unittest.html"},
        },
    });
    
    engine.link({href: "module:/unittest/"}).get().then(function (entity) {
        var result = entity.attr("body").split(/\n/);
        var count = 0| result[0].match(/^1\.\.(\d+)$/)[1];
        assert.equal(count, 1);
        result.slice(1).forEach(function (line) {
            var eachResult = line.match(/^((?:not )?ok) (\d+) -(.*)$/);
            if (!eachResult) return;
            assert.equal(eachResult[1], "ok", eachResult[3]);
        });
    }).then(done, done);
});
