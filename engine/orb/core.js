"use strict";

const url = require("url");

const spaceCore = require("../space/core");
const cachecontrol = require("../space/cachecontrol");
const conftree = require("../conftree");
const memory = require("./memory");

const states = new WeakMap();
const OrbField = class OrbField {
    static new(opts) {return Object.freeze(new OrbField(opts));}
    constructor (opts) {
        opts = conftree.create(opts, {cache: false});
        const orb = systemOrb();
        states.set(this, {opts, orb});
    }
    get opts() {return states.get(this).opts;}
    get orb() {return states.get(this).orb;}
    set orb(o) {states.get(this).orb = o;}
    access(request) {
        if (request.method === "GET") return accessGet(this, request);
        if (request.method === "PUT") return accessPut(this, request);
        return Promise.resolve([
            request, spaceCore.Response("405", {allow: "GET, PUT"})]);
    }
};

const accessGet = (self, request) => {
    return self.orb.get(request.location.pathname).then(entry => {
        if (!entry) return [request, spaceCore.Response("404", {})];
        if (self.opts.cache &&
            cachecontrol.clientCacheValid(request, entry.timestamp)) {
            // TBD: add ETag compare
            return [request, cachecontrol.NotModified];
        }
        return [request, spaceCore.Response("200", {
            "content-type": entry.type,
            "last-modified": entry.timestamp.toUTCString()
        }, entry.value)];
    });
};
const accessPut = (self, request) => {
    const data = {type: request.headers["content-type"], value: request.body};
    const pathname = request.location.pathname;
    return self.orb.put(pathname, data).then(
        entry => [request, spaceCore.Response("200", {
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
exports.OrbField = OrbField.new;
