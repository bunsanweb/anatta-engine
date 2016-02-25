"use strict";

const url = require("url");

const space = {
    core: require("../space/core"),
    cachecontrol: require("../space/cachecontrol")
};
const conftree = require("../conftree");
const memory = require("./memory");

const OrbField = function OrbField(opts) {
    const orb = systemOrb();
    return Object.create(OrbField.prototype, {
        opts: {value: conftree.create(opts, {cache: false})},
        orb: {value: orb, writable: true}
    });
};
OrbField.prototype.access = function (request) {
    if (request.method === "GET") return accessGet(this, request);
    if (request.method === "PUT") return accessPut(this, request);
    return Promise.resolve([
        request, space.core.Response("405", {allow: "GET, PUT"})]);
};

const accessGet = (self, request) => {
    return self.orb.get(request.location.pathname).then(entry => {
        if (!entry) return [request, space.core.Response("404", {})];
        if (self.opts.cache &&
            space.cachecontrol.clientCacheValid(request, entry.timestamp)) {
            // TBD: add ETag compare
            return [request, space.cachecontrol.NotModified];
        }
        return [request, space.core.Response("200", {
            "content-type": entry.type,
            "last-modified": entry.timestamp.toUTCString()
        }, entry.value)];
    });
};
const accessPut = (self, request) => {
    const data = {type: request.headers["content-type"], value: request.body};
    const pathname = request.location.pathname;
    return self.orb.put(pathname, data).then(
        entry => [request, space.core.Response("200", {
            "location": request.href
        })]);
};

const systemOrb = function () {
    const orbUri = url.parse(process.env.ORB_URI || "memory:", true, true);
    switch (orbUri.protocol) {
    case "memory:":
        return memory.Orb();
    case "file:":
    case "dir:":
        return require("./dir").Orb(orbUri.pathname);
    case "mongodb:":
        const collection = orbUri.hash ? orbUri.hash.substring(1) : undefined;
        const href = url.format(
            Object.create(orbUri, {hash: {value: undefined}}));
        return require("./mongodb").Orb(href, collection);
    }
    return memory.Orb();
};

exports.Entry = memory.Entry;
exports.Orb = memory.Orb;
exports.OrbField = OrbField;
