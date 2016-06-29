"use strict";

const fs = require("fs");
const path = require("path");
const memory = require("./memory");

const async = (obj, name) => (...args) => new Promise((f, r) => {
    const nodeCb = (err, result) => void (err ? r(err) : f(result));
    obj[name](...args.concat([nodeCb]));
});

const readdir = async(fs, "readdir");
const readFile = async(fs, "readFile");
const writeFile = async(fs, "writeFile");

const readEntry = (self, filename) => {
    const filepath = path.join(self.dir, filename);
    return readFile(filepath, "utf8").then(
        json => memory.Entry.fromJson(json), err => null);
};

const writeEntry = (self, filename, entry) => {
    const filepath = path.join(self.dir, filename);
    const json = entry.toJson();
    return writeFile(filepath, json, "utf8").then(ok => entry, err => null);
};

const states = new WeakMap();
const Orb = class Orb {
    static new(dir) {return Object.freeze(new Orb(dir));}
    constructor(dir) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        states.set(this, {dir});
    }
    entryList() {
        const self = states.get(this);
        return readdir(self.dir).then(filenames => Promise.all(
            filenames.map(name => readEntry(self, name))
        ).then(entryList => {
            const entries = {};
            entryList.forEach(entry => {
                if (entry) entries[entry.pathname] = entry;
            });
            return entries;
        }), err => ({}));
    }
    get(pathname) {
        const filename = encodeURIComponent(pathname);
        return readEntry(states.get(this), filename);
    }
    put(pathname, data) {
        const filename = encodeURIComponent(pathname);
        const entry = memory.Entry.fromValue(pathname, data);
        return writeEntry(states.get(this), filename, entry);
    }
};


exports.Orb = Orb.new;
