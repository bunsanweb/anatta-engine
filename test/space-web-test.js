"use strict";

const assert = require("assert");

suite("[Space Web]");
test("Create space core with http", function (done) {
    this.timeout(5000);
    const core = require("../engine/space/core");
    const web = require("../engine/space/web");
    
    const space = core.Space();
    const webField = web.WebField({});
    space.manager.bind("http", "http:", webField);
    space.manager.bind("https", "https:", webField);
    
    const req = core.Request("GET", "http://example.com/");
    space.access(req).then(([req, res]) => {
        assert.equal("200", res.status);
        // redirected
        //console.log([req.uri, req.from.uri, req.from.from.uri]);
        assert.equal(req.origin().href, "http://example.com/");
    }).then(done, done);
});
