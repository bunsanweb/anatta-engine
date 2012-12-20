"use strict";

var q = require("q");

var conftree = require("../conftree");
var space = {
    core: require("../space/core"),
};

var GalaxyField = function GalaxyField(opts) {
    opts = conftree.create(opts, {to: "module:/", from: "/"});
    return Object.create(GalaxyField.prototype, {
        engine: {value: null, writable: true},
        opts: {value: opts, enumerable: true},
    });
};
GalaxyField.prototype.access = function (request) {
    if (!this.engine || request.uri.search(this.opts.from) !== 0) {
        return space.core.FieldUtils.error(
            request, Error("invalid settings"), "404");
    }
    var uri = this.opts.to + req.url.substring(this.opts.from.length);
    var req = this.engine.space.request(
        request.method, uri, request.headers, request.body, request);
    return this.engine.space.access(req).spread(function (req, res) {
        // TBD: rewrite response info
        return [request, res];
    });
};

exports.GalaxyField = GalaxyField;
