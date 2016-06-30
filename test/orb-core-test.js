/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");

suite("[Orb Core]");
test("Create Orb field, do put then get", function (done) {
    const anatta = require("../anatta");
    const space = anatta.space.core.Space();
    const orbField = anatta.orb.core.OrbField();
    space.manager.bind("orb", "orb:", orbField);
    
    // put
    const body = "<html><body>Hello</body></html>";
    const put = space.request("PUT", "orb:/foo/bar/buzz.html", {
        "content-type": "text/html;charset=utf-8"
    }, Buffer.from(body));
    space.access(put).then(([request, response]) => {
        assert.equal(response.status, "200");
        assert.equal(response.headers["content-type"],
                     put.headers["content-type"]);
        assert.equal(response.headers["content-length"], body.length);
        assert.equal(response.text(), body);
    }).then(done, done);
});
