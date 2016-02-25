"use strict";

const conftree = require("../conftree");
const space = {
    core: require("../space/core")
};

const GalaxyField = function GalaxyField(opts) {
    opts = conftree.create(opts, {to: "module:/", from: "/"});
    return Object.create(GalaxyField.prototype, {
        engine: {value: null, writable: true},
        opts: {value: opts, enumerable: true}
    });
};
GalaxyField.prototype.access = function (request) {
    if (!this.engine || request.href.indexOf(this.opts.from) !== 0) {
        return space.core.FieldUtils.error(
            request, Error("invalid settings"), "404");
    }
    const uripart = request.href.substring(this.opts.from.length);
    const uri = `${this.opts.to}${uripart}`;

    const req = this.engine.space.request(
        request.method, uri, request.headers, request.body, request);
    return this.engine.space.access(req).then(a => Promise.all(a)).then(
        reqres => [request, reqres[1]]);
};

exports.GalaxyField = GalaxyField;
