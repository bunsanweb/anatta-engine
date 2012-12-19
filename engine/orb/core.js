"use strict";

var crypto = require("crypto");
var q = require("q");

var space = {
    core: require("../space/core"),
};

var Entry = function Entry(pathname, type, value, timestamp) {
    value = value || Buffer();
    var alg = crypto.createHash("sha256");
    var hash = value.length > 0 ? alg.update(value).digest("base64") : "";
    return Object.create(Entry.prototype, {
        pathname: {value: pathname, enumerable: true},
        type: {value: type, enumerable: true},
        value: {value: value, enumerable: true}, // Buffer
        timestamp: {value: timestamp || new Date(), enumerable: true},
        hash: {value: hash, enumerable: true},
    });
};
Entry.fromValue = function (pathname, data) {
    return Entry(pathname, data.type, data.value, data.timestamp);
};
Entry.fromJson = function (json) {
    return Entry(json.pathname, json.type, json.value,
                 new Date(json.timestamp));
};
Entry.exists = function (entry) {
    return entry && entry.value !== null;
};
Entry.equal = function (a, b) {
    if (!a || !b) return !a && !b;
    return a.pathname === b.pathname && a.type === b.type &&
        a.timestamp === b.timestamp &&
        a.hash === b.hash && bufferEq(a.value, b.value);
};

var bufferEq = function (a, b) {
    if (!a || !b) return !a && !b;
    if (a.length !== b.length) return false;
    return a.toString("binary") === b.toString("binary");
};

var Orb = function Orb(init) {
    return Object.create(Orb.prototype, {
        entries: {value: init || {}, writable: true, enumerable: true},
    });
};
Orb.prototype.entryList = function () {
    return q.resolve(this.entries);
};
Orb.prototype.get = function (pathname) {
    var entry = this.entries[pathname];
    return q.resolve(entry || null);
};
Orb.prototype.put = function (pathname, data) {
    var entry = Entry.fromValue(pathname, data);
    this.entries[pathname] = entry;
    return q.resolve(entry);
};

var OrbField = function OrbField(orb) {
    return Object.create(OrbField.prototype, {
        orb: {value: orb || Orb(), writable: true},
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

exports.Entry = Entry;
exports.Orb = Orb;
exports.OrbField = OrbField;
