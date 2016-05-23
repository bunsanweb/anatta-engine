"use strict";

const crypto = require("crypto");

const conftree = require("../conftree");

const Entry = class Entry {
    static new(pathname, type, value, timestamp) {
        return Object.freeze(new Entry(pathname, type, value, timestamp));
    }
    constructor (pathname, type, value, timestamp) {
        value = value || Buffer.from([]);
        timestamp = timestamp || new Date();
        const alg = crypto.createHash("sha256");
        const hash =
                  value.length > 0 ? alg.update(value).digest("base64") : "";
        Object.assign(this, {pathname, type, value, timestamp, hash});
    }
    toObject() {
        return {
            pathname: this.pathname,
            type: this.type,
            value: this.value.toString("base64"),
            timestamp: this.timestamp.toUTCString()            
        };
    }
    toJson() {return JSON.stringify(this.toObject());}
    static fromValue(pathname, data) {
        return Entry.new(pathname, data.type, data.value, data.timestamp);
    };
    static fromObject(data) {
        const value = Buffer.from(data.value, "base64");
        const date = new Date(data.timestamp);
        return Entry.new(data.pathname, data.type, value, date);
    }
    static fromJson(json) {
        try {
            const data = JSON.parse(json);
            return Entry.fromObject(data);
        } catch (ex) {
            return null;
        }
    }
    static exists(entry) {return entry && entry.value !== null;}
    static queal(a, b) {
        if (!a || !b) return !a && !b;
        return a.pathname === b.pathname && a.type === b.type &&
            a.timestamp === b.timestamp &&
            a.hash === b.hash && bufferEq(a.value, b.value);
    }
};

const bufferEq = (a, b) => {
    if (!a || !b) return !a && !b;
    if (a.length !== b.length) return false;
    return a.toString("binary") === b.toString("binary");
};

const states = new WeakMap();
const Orb = class Orb {
    static new(init) {return Object.freeze(new Orb(init));}
    constructor (init) {states.set(this, {entries: init || {}});}
    entryList() {return Promise.resolve(states.get(this).entries);}
    get(pathname) {
        const entry = states.get(this).entries[pathname];
        return Promise.resolve(entry || null);
    }
    put(pathname, data) {
        const entry = Entry.fromValue(pathname, data);
        states.get(this).entries[pathname] = entry;
        return Promise.resolve(entry);
    }
};

exports.Entry = Entry;
exports.Orb = Orb.new;
