"use strict";

var assert = require("assert");

suite("[Orb Dir]");
test("Create Orb field with dir.Orb , do put then get", function (done) {
    var dir = tmpDir();
    var anatta = require("../anatta");
    var space = anatta.space.core.Space();
    var orbField = anatta.orb.core.OrbField();
    orbField.orb = anatta.orb.dir.Orb(dir);
    space.manager.bind("orb", "orb:", orbField);
    
    // put
    var body = "<html><body>Hello</body></html>";
    var put = space.request("PUT", "orb:/foo/bar/buzz.html", {
        "content-type": "text/html;charset=utf-8"
    }, Buffer(body));
    space.access(put).spread(function (request, response) {
        assert.equal(response.status, "200");
        assert.equal(response.headers["content-type"],
                     put.headers["content-type"]);
        assert.equal(response.headers["content-length"], body.length);
        assert.equal(response.body.toString(), body);
    }).then(function () {
        var get = space.request("GET", "orb:/foo/bar/buzz.html");
        return space.access(get).spread(function (request, response) {
            assert.equal(response.status, "200");
            assert.equal(response.headers["content-type"],
                         put.headers["content-type"]);
            assert.equal(response.headers["content-length"], body.length);
            assert.equal(response.body.toString(), body);
        });
    }).then(function () {
        cleanupDir(dir);
    }).then(done, done);
});

var tmpDir = function () {
    var fs = require("fs");
    var os = require("os");
    var path = require("path");
    return path.join(os.tmpDir(), "anatta-engine-orb-dir-test-" + process.pid);
};
var cleanupDir = function (dir) {
    var fs = require("fs");
    var path = require("path");
    fs.readdirSync(dir).forEach(function (name) {
        var file = path.join(dir, name);
        fs.unlinkSync(file);
    });
    fs.rmdirSync(dir);
};
