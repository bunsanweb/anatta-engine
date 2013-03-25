"use strict";

var fs = require("fs");
var path = require("path");
var q = require("q");
var memory = require("./memory");

var Orb = function Orb(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    return Object.create(Orb.prototype, {
        dir: {value: dir, enumerable: true},
    });
};
Orb.prototype.entryList = function () {
    var self = this;
    var d = q.defer();
    fs.readdir(this.dir, function (err, filenames) {
        if (err) return d.resolve({});
        q.all(filenames.map(readEntry.bind(self))).then(function (entryList) {
            var entries = {};
            entryList.forEach(function (entry) {
                if (entry) entries[entry.pathname] = entry;
            });
            d.resolve(entries);
        });
    });
    return d.promise;
};
Orb.prototype.get = function (pathname) {
    var filename = encodeURIComponent(pathname);
    return readEntry.call(this, filename);
};
Orb.prototype.put = function (pathname, data) {
    var filename = encodeURIComponent(pathname);
    var entry = memory.Entry.fromValue(pathname, data);
    return writeEntry.call(this, filename, entry);
};

var readEntry = function (filename) {
    var filepath = path.join(this.dir, filename);
    var d = q.defer();
    fs.readFile(filepath, "utf8", function (err, json) {
        if (err) return d.resolve(null);
        var entry = memory.Entry.fromJson(json);
        d.resolve(entry);
    });
    return d.promise;
};
var writeEntry = function (filename, entry) {
    var filepath = path.join(this.dir, filename);
    var d = q.defer();
    var json = entry.toJson();
    fs.writeFile(filepath, json, "utf8", function (err) {
        if (err) return d.resolve(null);
        d.resolve(entry);
    });
    return d.promise;
};

exports.Orb = Orb;
