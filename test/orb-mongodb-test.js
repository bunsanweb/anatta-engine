"use strict";

var assert = require("assert");

suite("[Orb MongoDB]");
test("Create Orb field with mongodb.Orb, do put then get", function (done) {
    this.timeout(10000);
    var anatta = require("../anatta");
    
    var dbname = "anatta-engine-orb-mongodb-test-" + process.pid;
    var uri = "mongodb://127.0.0.1:27017/" + dbname;
    
    var space = anatta.space.core.Space();
    var orbField = anatta.orb.core.OrbField();
    orbField.orb = anatta.orb.mongodb.Orb(uri);
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
        assert.equal(response.text(), body);
    }).then(function () {
        var get = space.request("GET", "orb:/foo/bar/buzz.html");
        return space.access(get).spread(function (request, response) {
            assert.equal(response.status, "200");
            assert.equal(response.headers["content-type"],
                         put.headers["content-type"]);
            assert.equal(response.headers["content-length"], body.length);
            assert.equal(response.text(), body);
        });
    }).finally(function () {
        return cleanupDatabase(uri);
    }).then(done, done);
});

var cleanupDatabase = function (uri) {
    var q = require("q");
    var mongodb = require("mongodb");
    var d = q.defer();
    mongodb.connect(uri, function (err, db) {
        if (err) return d.reject(err);
        db.dropDatabase(function (err, result) {
            if (err) return d.reject(err);
            return d.resolve();
        });
    });
    return d.promise;
};
