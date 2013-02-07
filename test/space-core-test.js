"use strict";

var assert = require("assert");

suite("[Space Core]");
test("Create raw space core", function (done) {
    var core = require("../engine/space/core");
    var space = core.Space();
    var req = core.Request("GET", "http://foo.bar.com");
    space.access(req).spread(function (req, res) {
        assert.equal("404", res.status);
        assert.equal("Resource not found: http://foo.bar.com", 
                     res.body.toString());
    }).then(done, done);
});

test("access to field with longest matched prefix", function (done) {
    var core = require("../engine/space/core");
    var q = require("q");

    var TextField = function TextField (text) {
        return Object.create({
            text: text,
            access: function (request) {
                var d = q.defer();
                var response = core.Response("200", {
                    "content-type": "text/plain"}, text);
                d.resolve([request, response]);
                return d.promise;
            }
        });
    };
    var space = core.Space();
    var field1 = TextField("this is field1");
    var field2 = TextField("this is field2");
    space.manager.bind("foo", "foo:/", field1);
    space.manager.bind("foobar", "foo:/bar", field2);

    var req = core.Request("GET", "foo:/bar/buz");
    space.access(req).spread(function (req, res) {
        assert.equal("200", res.status);
        assert.equal(field2.text, res.body.toString());
    }).then(done, done);
});
