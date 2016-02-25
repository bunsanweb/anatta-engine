"use strict";

const crypto = require("crypto");

const conftree = require("../conftree");

const Entry = function Entry(pathname, type, value, timestamp) {
    value = value || Buffer();
    const alg = crypto.createHash("sha256");
    const hash = value.length > 0 ? alg.update(value).digest("base64") : "";
    return Object.create(Entry.prototype, {
        pathname: {value: pathname, enumerable: true},
        type: {value: type, enumerable: true},
        value: {value: value, enumerable: true},
        timestamp: {value: timestamp || new Date(), enumerable: true},
        hash: {value: hash, enumerable: true}
    });
};
Entry.fromValue = function (pathname, data) {
    return Entry(pathname, data.type, data.value, data.timestamp);
};
Entry.prototype.toObject = function () {
    return {
        pathname: this.pathname,
        type: this.type,
        value: this.value.toString("base64"),
        timestamp: this.timestamp.toUTCString()
    };
};
Entry.prototype.toJson = function () {
    return JSON.stringify(this.toObject());
};
Entry.fromObject = function (data) {
    const value = Buffer(data.value, "base64");
    const date = new Date(data.timestamp);
    return Entry(data.pathname, data.type, value, date);
};
Entry.fromJson = function (json) {
    try {
        const data = JSON.parse(json);
        return Entry.fromObject(data);
    } catch (ex) {
        return null;
    }
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

const bufferEq = (a, b) => {
    if (!a || !b) return !a && !b;
    if (a.length !== b.length) return false;
    return a.toString("binary") === b.toString("binary");
};

const Orb = function Orb(init) {
    return Object.create(Orb.prototype, {
        entries: {value: init || {}, writable: true, enumerable: true}
    });
};
Orb.prototype.entryList = function () {
    return Promise.resolve(this.entries);
};
Orb.prototype.get = function (pathname) {
    const entry = this.entries[pathname];
    return Promise.resolve(entry || null);
};
Orb.prototype.put = function (pathname, data) {
    const entry = Entry.fromValue(pathname, data);
    this.entries[pathname] = entry;
    return Promise.resolve(entry);
};

exports.Entry = Entry;
exports.Orb = Orb;
