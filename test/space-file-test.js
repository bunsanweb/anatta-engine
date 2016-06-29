/*eslint prefer-arrow-callback: 0*/
"use strict";

const assert = require("assert");

suite("[Space File]");
test("Create space core with file", function (done) {
    const core = require("../engine/space/core");
    const file = require("../engine/space/file");
    
    const space = core.Space();
    const fileField = file.FileField({root: ".", prefix: "prefix/"});
    space.manager.bind("file", "file:", fileField);
    
    const req = core.Request("GET", "file:prefix/package.json");
    space.access(req).then(([req, res]) => {
        const fs = require("fs");
        assert.equal("200", res.status);
        assert.equal(fs.readFileSync("package.json").toString(), res.text());
    }).then(done, done);
});
