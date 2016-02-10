"use strict";

const assert = require("assert");

suite("[shared/fusion]");
test("via unittest agent", function (done) {
    const anatta = require("../anatta");

    const engine = anatta.engine.builder.engine({
        type: "generic",
        porter: {
            "application/json": "json",
            "text/html": "html",
        },
        space: {
            "src:": {
                field: "file", root: "./test/assets/fusion/", prefix: "/"},
            "src:/shared/": {
                field: "file", root: anatta.shared(), prefix: "/shared/"},
            "module:/unittest/": {field: "agent", uri: "src:/unittest.html"},
        },
    });
    
    engine.link({href: "module:/unittest/"}).get().then(entity => {
        const tap = parseTap(entity.attr("body"));
        tap.tests.forEach(t => {
            if (t.ok) return;
            const head = `not ok ${t.id} ${t.info}`;
            throw new assert.AssertionError({
                message: `${head}${"\n"}${t.detail}`});
        });
    }).then(done, done);
});

const parseTap = (tapresult) => {
    const lines = tapresult.split(/\n/);
    const count = 0| lines[0].match(/^1\.\.(\d+)$/)[1];
    const tests = [];
    let pass = 0, fail = 0;
    lines.slice(1).forEach(line => {
        if (line.match(/^  /)) {
            tests[tests.length - 1].detail += line.slice(2) + "\n";
            return;
        }
        const test = line.match(/^((?:not )?ok) (\d+) -(.*)$/);
        if (!test) return;
        const ok = test[1] === "ok";
        if (ok) pass += 1; else fail += 1;
        tests.push({ok: ok, id: 0|test[2], info: test[3], detail: ""})
    });
    return {count: count, pass: pass, fail: fail, tests: tests};
};
