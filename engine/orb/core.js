"use strict";

var url = require("url");
var q = require("q");

var space = {
    core: require("../space/core"),
};
var conftree = require("../conftree");
var memory = require("./memory");

var OrbField = function OrbField(opts) {
    var orb = systemOrb();
    return Object.create(OrbField.prototype, {
        opts: {value: conftree.create(opts, {})},
        orb: {value: orb, writable: true},
    });
};
OrbField.prototype.access = function (request) {
    if (request.method === "GET") return accessGet.call(this, request);
    if (request.method === "PUT") return accessPut.call(this, request);
    return q.resolve(
        [request, space.core.Response("405", {allow: "GET, PUT"})]);
};

var accessGet = function (request) {
    return this.orb.get(request.location.pathname).then(function (entry) {
        if (!entry) return [request, space.core.Response("404", {})];
        return [request, space.core.Response("200", {
            "content-type": entry.type,
            "last-modified": entry.timestamp.toUTCString(),
        }, entry.value)];
    });
};
var accessPut = function (request) {
    var data = {type: request.headers["content-type"], value: request.body};
    var pathname = request.location.pathname;
    return this.orb.put(pathname, data).then(function (entry) {
        return [request, space.core.Response("200", {
            "location": request.href,
        })];
    });
};

var systemOrb = function () {
    var orbUri = url.parse(process.env.ORB_URI || "memory:", true, true);
    switch (orbUri.protocol) {
    case "memory:":
        return memory.Orb();
    case "file:":
    case "dir:":
        return require("./dir").Orb(orbUri.pathname);
    case "mongodb:":
        var collection = orbUri.hash ? orbUri.hash.substring(1) : undefined;
        var href = url.format(
            Object.create(orbUri, {hash: {value: undefined}}));
        return require("./mongodb").Orb(href, collection);
    }
    return memory.Orb();
};

exports.Entry = memory.Entry;
exports.Orb = memory.Orb;
exports.OrbField = OrbField;
