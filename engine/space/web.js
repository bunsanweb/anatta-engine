"use strict";

var url = require("url");
var protocols = {
    "http:": require("http"),
    "https:": require("https"),
};
var q = require("q");
var core = require("./core");
var conftree = require("../conftree");

var WebField = function WebField(opts) {
    return Object.create(WebField.prototype, {
        opts: {value: conftree.create(opts, {})},
    });
};
WebField.prototype.access = function (request) {
    var deferred = q.defer();
    var opts = url.parse(request.href);
    opts.method = request.method;
    opts.headers = request.headers;
    var req = protocols[opts.protocol].request(opts, function (res) {
        var chunks = [];
        res.on("data", chunks.push.bind(chunks));
        res.on("end", function () {
            var body = Buffer.concat(chunks);
            var response = core.Response(res.statusCode, res.headers, body);
            deferred.resolve([request, response]);
        });
    });
    req.on("error", function (err) {
        deferred.resolve(core.FieldUtils.error(request, err, "400"));
    });
    req.end(request.body);
    return deferred.promise;
};

exports.WebField = WebField;
