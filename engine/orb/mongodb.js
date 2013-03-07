"use strict";

var mongodb = require("mongodb");
var q = require("q");
var memory = require("./memory");

var Orb = function Orb(uri, collection) {
    return Object.create(Orb.prototype, {
        uri: {value: uri || "mongodb://localhost/mongorb", enumerable: true},
        collection: {value: collection || "entries", enumerable: true}
    });
};
Orb.prototype.get = function (pathname) {
    var self = this;
    var d = q.defer();
    mongodb.connect(self.uri, function (err, db) {
        if (err) return exit(db, d, err);
        db.collection(self.collection, function (err, collection) {
            if (err) return exit(db, d, err);
            var query = {pathname: pathname};
            collection.findOne(query, function (err, doc) {
                if (err) return exit(db, d, err);
                var entry = memory.Entry.fromJson(JSON.stringify(doc));
                d.resolve(entry);
                db.close();
            });
        });
    });
    return d.promise;
};
Orb.prototype.put = function (pathname, data) {
    var self = this;
    var d = q.defer();
    mongodb.connect(self.uri, function (err, db) {
        if (err) return exit(db, d, err);
        db.collection(self.collection, function (err, collection) {
            if (err) return exit(db, d, err);
            var query = {pathname: pathname};
            var entry = memory.Entry.fromValue(pathname, data);
            var doc = JSON.parse(entry.toJson());
            collection.update(query, doc, {upsert: true},
                function (err, doc) {
                    if (err) return exit(db, d, err);
                    d.resolve(doc);
                    db.close();
            });
        });
    });
    return d.promise;
};

var exit = function (db, defer, error) {
    if (db) db.close();
    return defer.resolve(error);
};

exports.Orb = Orb;
