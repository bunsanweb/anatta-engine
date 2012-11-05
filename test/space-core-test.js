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
