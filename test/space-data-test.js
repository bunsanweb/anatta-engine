var assert = require("assert");

suite("[Space Data]");
test("Create space core with data", function (done) {
    var core = require("../engine/space/core");
    var data = require("../engine/space/data");
    
    var space = core.Space();
    var dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    var req = core.Request("GET", "data:,foo");
    space.access(req).spread(function (req, res) {
        assert.equal("200", res.status);
        assert.equal("text/plain;charset=utf-8", res.headers["content-type"]);
        assert.equal("foo", res.body.toString());
    }).then(done, done);
});
test("data scheme URI with content-type", function (done) {
    var core = require("../engine/space/core");
    var data = require("../engine/space/data");
    
    var space = core.Space();
    var dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    var uri = "data:text/html;charset=utf-8,<body>foo</body>";
    var req = core.Request("GET", uri);
    space.access(req).spread(function (req, res) {
        assert.equal("200", res.status);
        assert.equal("text/html;charset=utf-8", res.headers["content-type"]);
        assert.equal("<body>foo</body>", res.body.toString());
    }).then(done, done);
});
test("data scheme URI encoded base64", function (done) {
    var core = require("../engine/space/core");
    var data = require("../engine/space/data");
    
    var space = core.Space();
    var dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    var body = "<body>foo</body>";
    var coded = new Buffer(body).toString("base64");
    var uri = "data:;base64," + coded;
    var req = core.Request("GET", uri);
    space.access(req).spread(function (req, res) {
        assert.equal("200", res.status);
        assert.equal("text/plain;charset=utf-8", res.headers["content-type"]);
        assert.equal("<body>foo</body>", res.body.toString());
    }).then(done, done);
});
test("data scheme URI encoded base64 with content-type", function (done) {
    var core = require("../engine/space/core");
    var data = require("../engine/space/data");
    
    var space = core.Space();
    var dataField = data.DataField({});
    space.manager.bind("data", "data:", dataField);
    
    var body = "<body>foo</body>";
    var coded = new Buffer(body).toString("base64");
    var uri = "data:text/html;charset=utf-8;base64," + coded;
    var req = core.Request("GET", uri);
    space.access(req).spread(function (req, res) {
        assert.equal("200", res.status);
        assert.equal("text/html;charset=utf-8", res.headers["content-type"]);
        assert.equal("<body>foo</body>", res.body.toString());
    }).then(done, done);
});
