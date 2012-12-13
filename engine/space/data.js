var q = require("q");
var core = require("./core");
var conftree = require("../conftree");

var DataField = function DataField(opts) {
    return Object.create(DataField.prototype, {
        opts: {value: conftree.create(opts, {})},
    });
};
var uric = "[^/;?:@&=+,]";
var dsPattern = new RegExp(
    "^data:" + 
        "(" + uric + "+/" + uric + "+(?:;" + uric + "+=" + uric + "+)*)?" +
        "(;base64)?,(.*)$");
DataField.prototype.access = function (request) {
    if (request.method !== "GET") {
        return q.resolve([request, core.Response("405", {allow: "GET"})]);
    }
    var data = dsPattern.exec(request.uri);
    if (!data) {
        return core.FieldUtil.error(request, "Invalid Data Scheme URI", "404");
    }
    var body = new Buffer(decodeURI(data[3]), data[2] ? "base64" : "utf-8");
    var response = core.Response("200", {
        "content-type": data[1] ? data[1] : "text/plain;charset=utf-8",
        "content-length": body.length.toString(),
    }, body);
    return q.resolve([request, response]);
};

exports.DataField = DataField;
