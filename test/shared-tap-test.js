/*eslint prefer-arrow-callback: 0*/
"use strict";

const assert = require("assert");

suite("[shared/tap]");
test("self test as tap agent", function (done) {
    const anatta = require("../anatta");

    const engine = anatta.engine.builder.engine({
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
    
    engine.link({href: "module:/unittest/"}).get().then(entity => {
        const result = entity.attr("body").split(/\n/);
        const count = result[0].match(/^1\.\.(\d+)$/)[1] |0;
        assert.equal(count, 1);
        result.slice(1).forEach(line => {
            const eachResult = line.match(/^((?:not )?ok) (\d+) -(.*)$/);
            if (!eachResult) return;
            assert.equal(eachResult[1], "ok", eachResult[3]);
        });
    }).then(done, done);
});
