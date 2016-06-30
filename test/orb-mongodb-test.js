/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");

//NOTE: mongodb server required. e.g.
//    mkdir tmpdb ; mongod --dbpath ./tempdb/ ; npm test ; rm -rf tmpdb
suite("[Orb MongoDB]");
test("Create Orb field with mongodb.Orb, do put then get", function (done) {
    this.timeout(10000);
    const anatta = require("../anatta");
    const dbname = `anatta-engine-orb-mongodb-test-${process.pid}`;
    const uri = `mongodb://127.0.0.1:27017/${dbname}`;
    
    const space = anatta.space.core.Space();
    const orbField = anatta.orb.core.OrbField();
    orbField.orb = anatta.orb.mongodb.Orb(uri);
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
    }).then(() => cleanupDatabase(uri), () => cleanupDatabase(uri)).then(
        done, done);
});

const cleanupDatabase = (uri) => new Promise((f, r) => {
    const mongodb = require("mongodb");
    mongodb.connect(
        uri, (err, db) => err ? r(err) :
            db.dropDatabase((err, result) => err ? r(err) : f(undefined)));
    //NOTE: success with undefined for the last `done` callback arguments
});

