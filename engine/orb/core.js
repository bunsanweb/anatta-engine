"use strict";

var q = require("q");

var space = {
    core: require("../space/core"),
};
var conftree = require("../conftree");
var memory = require("./memory");


var OrbField = function OrbField(opts) {
    return Object.create(OrbField.prototype, {
        opts: {value: conftree.create(opts, {})},
        orb: {value: memory.Orb(), writable: true},
    });
};
OrbField.prototype.access = function (request) {
    if (request.method === "GET") return accessGet.call(this, request);
    if (request.method === "PUT") return accessPut.call(this, request);
    return q.resolve(
        [request, space.core.Response("405", {allow: "GET, PUT"})]);
};

var accessGet = function (request) {
    return this.orb.get(request.uriObject.pathname).then(function (entry) {
        if (!entry) return [request, space.core.Response("404", {})];
        return [request, space.core.Response("200", {
            "content-type": entry.type,
            "last-modified": entry.timestamp.toUTCString(),
        }, entry.value)];
    });
};
var accessPut = function (request) {
    var data = {type: request.headers["content-type"], value: request.body};
    var pathname = request.uriObject.pathname;
    return this.orb.put(pathname, data).then(function (entry) {
        return [request, space.core.Response("200", {
            "location": request.uri,
        })];
    });
};

exports.Entry = memory.Entry;
exports.Orb = memory.Orb;
exports.OrbField = OrbField;
