"use strict";

var crypto = require("crypto");
var q = require("q");

var conftree = require("../conftree");

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
Entry.prototype.toJson = function () {
    return JSON.stringify({
        pathname: this.pathname,
        type: this.type,
        value: this.value.toString("base64"),
        timestamp: this.timestamp.toUTCString(),
    });
};
Entry.fromJson = function (json) {
    var data = JSON.parse(json);
    var value = Buffer(data.value, "base64");
    var date = new Date(data.timestamp);
    return Entry(data.pathname, data.type, value, date);
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

exports.Entry = Entry;
exports.Orb = Orb;
