"use strict";

const fs = require("fs");
const path = require("path");
const memory = require("./memory");

const Orb = function Orb(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    return Object.create(Orb.prototype, {
        dir: {value: dir, enumerable: true}
    });
};
Orb.prototype.entryList = function () {
    return new Promise((f, r) => {
        fs.readdir(this.dir, (err, filenames) => {
            if (err) return f({});
            const allEntry = filenames.map(name => readEntry(this, name));
            return Promise.all(allEntry).then(entryList => {
                const entries = {};
                entryList.forEach(entry => {
                    if (entry) entries[entry.pathname] = entry;
                });
                f(entries);
            });
        });
    });
};
Orb.prototype.get = function (pathname) {
    const filename = encodeURIComponent(pathname);
    return readEntry(this, filename);
};
Orb.prototype.put = function (pathname, data) {
    const filename = encodeURIComponent(pathname);
    const entry = memory.Entry.fromValue(pathname, data);
    return writeEntry(this, filename, entry);
};

const readEntry = (self, filename) => new Promise((f, r) => {
    const filepath = path.join(self.dir, filename);
    fs.readFile(
        filepath, "utf8",
        (err, json) => f(err ? null : memory.Entry.fromJson(json)));
});

const writeEntry = (self, filename, entry) => new Promise((f, r) => {
    const filepath = path.join(this.dir, filename);
    const json = entry.toJson();
    fs.writeFile(filepath, json, "utf8", err => f(err ? null : entry));
});

exports.Orb = Orb;
