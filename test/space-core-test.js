/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");

suite("[Space Core]");
test("Create raw space core", function (done) {
    const core = require("../engine/space/core");
    const space = core.Space();
    const req = core.Request("GET", "http://foo.bar.com");
    space.access(req).then(([req, res]) => {
        assert.equal("404", res.status);
        assert.equal("Resource not found: http://foo.bar.com", res.text());
    }).then(done, done);
});

test("access to field with longest matched prefix", function (done) {
    const core = require("../engine/space/core");
    const TextField = class {
        constructor(text) {
            this.text = text;
        }
        access(request) {
            return new Promise(f => f([
                request,
                core.Response("200", {"content-type": "text/plain"}, this.text)
            ]));
        }
    };
    const space = core.Space();
    const field1 = new TextField("this is field1");
    const field2 = new TextField("this is field2");
    space.manager.bind("foo", "foo:/", field1);
    space.manager.bind("foobar", "foo:/bar", field2);

    const req = core.Request("GET", "foo:/bar/buz");
    space.access(req).then(([req, res]) => {
        assert.equal("200", res.status);
        assert.equal(field2.text, res.text());
    }).then(done, done);
});
