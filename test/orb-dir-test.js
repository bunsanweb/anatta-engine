"use strict";

const assert = require("assert");

suite("[Orb Dir]");
test("Create Orb field with dir.Orb , do put then get", function (done) {
    const dir = tmpDir();
    const anatta = require("../anatta");
    const space = anatta.space.core.Space();
    const orbField = anatta.orb.core.OrbField();
    orbField.orb = anatta.orb.dir.Orb(dir);
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
    }).then(() => {
        const get = space.request("GET", "orb:/foo/bar/buzz.html");
        return space.access(get);
    }).then(([request, response]) => {
        assert.equal(response.status, "200");
        assert.equal(response.headers["content-type"],
                     put.headers["content-type"]);
        assert.equal(response.headers["content-length"], body.length);
        assert.equal(response.text(), body);
    }).then(() => cleanupDir(dir), () => cleanupDir(dir)).then(done, done);
});

const tmpDir = () => {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    return path.join(os.tmpDir(), `anatta-engine-orb-dir-test-${process.pid}`);
};
const cleanupDir = (dir) => {
    const fs = require("fs");
    const path = require("path");
    fs.readdirSync(dir).forEach(name => fs.unlinkSync(path.join(dir, name)));
    fs.rmdirSync(dir);
};
