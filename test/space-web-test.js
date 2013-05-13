"use strict";

var assert = require("assert");

suite("[Space Web]");
test("Create space core with http", function (done) {
    this.timeout(5000);
    var core = require("../engine/space/core");
    var web = require("../engine/space/web");
    
    var space = core.Space();
    var webField = web.WebField({});
    space.manager.bind("http", "http:", webField);
    space.manager.bind("https", "https:", webField);
    
    var req = core.Request("GET", "http://example.com/");
    space.access(req).spread(function (req, res) {
        assert.equal("200", res.status);
        // redirected
        //console.log([req.uri, req.from.uri, req.from.from.uri]);
        assert.equal(req.origin().href, "http://example.com/");
        assert.equal(req.href, "http://example.iana.org");
    }).then(done, done);
});
