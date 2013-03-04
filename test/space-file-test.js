"use strict";

var assert = require("assert");

suite("[Space File]");
test("Create space core with file", function (done) {
    var core = require("../engine/space/core");
    var file = require("../engine/space/file");
    
    var space = core.Space();
    var fileField = file.FileField({root: ".", prefix: "prefix/"});
    space.manager.bind("file", "file:", fileField);
    
    var req = core.Request("GET", "file:prefix/package.json");
    space.access(req).spread(function (req, res) {
        var fs = require("fs");
        assert.equal("200", res.status);
        assert.equal(fs.readFileSync("package.json").toString(), res.text());
    }).then(done, done);
});
