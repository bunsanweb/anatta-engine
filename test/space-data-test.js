/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");

suite("[Space Data]");
test("Create space core with data", function (done) {
    const core = require("../engine/space/core");
    const data = require("../engine/space/data");
    
    const space = core.Space();
    const dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    const req = core.Request("GET", "data:,foo");
    space.access(req).then(([req, res]) => {
        assert.equal("200", res.status);
        assert.equal("text/plain;charset=utf-8", res.headers["content-type"]);
        assert.equal("foo", res.text());
    }).then(done, done);
});
test("data scheme URI with content-type", function (done) {
    const core = require("../engine/space/core");
    const data = require("../engine/space/data");
    
    const space = core.Space();
    const dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    const uri = "data:text/html;charset=utf-8,<body>foo</body>";
    const req = core.Request("GET", uri);
    space.access(req).then(([req, res]) => {
        assert.equal("200", res.status);
        assert.equal("text/html;charset=utf-8", res.headers["content-type"]);
        assert.equal("<body>foo</body>", res.text());
    }).then(done, done);
});
test("data scheme URI encoded base64", function (done) {
    const core = require("../engine/space/core");
    const data = require("../engine/space/data");
    
    const space = core.Space();
    const dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    const body = "<body>foo</body>";
    const coded = Buffer.from(body).toString("base64");
    const uri = `data:;base64,${coded}`;
    const req = core.Request("GET", uri);
    space.access(req).then(([req, res]) => {
        assert.equal("200", res.status);
        assert.equal("text/plain;charset=utf-8", res.headers["content-type"]);
        assert.equal("<body>foo</body>", res.body.toString());
    }).then(done, done);
});
test("data scheme URI encoded base64 with content-type", function (done) {
    const core = require("../engine/space/core");
    const data = require("../engine/space/data");
    
    const space = core.Space();
    const dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    const body = "<body>foo</body>";
    const coded = Buffer.from(body).toString("base64");
    const uri = `data:text/html;charset=utf-8;base64,${coded}`;
    const req = core.Request("GET", uri);
    space.access(req).then(([req, res]) => {
        assert.equal("200", res.status);
        assert.equal("text/html;charset=utf-8", res.headers["content-type"]);
        assert.equal("<body>foo</body>", res.body.toString());
    }).then(done, done);
});
