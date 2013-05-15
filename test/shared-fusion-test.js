"use strict";

var assert = require("assert");

suite("[shared/fusion]");
test("via unittest agent", function (done) {
    var anatta = require("../anatta");

    var engine = anatta.engine.builder.engine({
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
    
    engine.link({href: "module:/unittest/"}).get().then(function (entity) {
        var tap = parseTap(entity.attr("body"));
        tap.tests.forEach(function (t) {
            if (t.ok) return;
            var head = "not ok " + t.id + " " + t.info;
            throw new assert.AssertionError({message: head + "\n" + t.detail});
        });
    }).then(done, done);
});

var parseTap = function (tapresult) {
    var lines = tapresult.split(/\n/);
    var count = 0| lines[0].match(/^1\.\.(\d+)$/)[1];
    var pass = 0, fail = 0;
    var tests = [];
    lines.slice(1).forEach(function (line) {
        if (line.match(/^  /)) {
            tests[tests.length - 1].detail += line.slice(2) + "\n";
            return;
        }
        var test = line.match(/^((?:not )?ok) (\d+) -(.*)$/);
        if (!test) return;
        var ok = test[1] === "ok";
        if (ok) pass += 1; else fail += 1;
        tests.push({ok: ok, id: 0|test[2], info: test[3], detail: ""})
    });
    return {count: count, pass: pass, fail: fail, tests: tests};
};
