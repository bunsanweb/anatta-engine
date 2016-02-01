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
Orb.prototype.entryList = function () {
    var entries = this.collection;
    return async(mongodb, "connect")(this.uri).then(function (db) {
        return async(db, "collection")(entries).then(function (collection) {
            return async(collection.find(), "toArray")();
        }).then(function (docs) {
            return docs.reduce(function (result, doc) {
                result[doc.pathname] = memory.Entry.fromObject(doc);
                return result;
            }, {});
        }).finally(function () {
            db.close();
        });
    }).catch(function (err) {
        return {};
    });
};
Orb.prototype.get = function (pathname) {
    var entries = this.collection;
    return async(mongodb, "connect")(this.uri).then(function (db) {
        return async(db, "collection")(entries).then(function (collection) {
            return async(collection, "findOne")({pathname: pathname});
        }).then(function (doc) {
            return memory.Entry.fromObject(doc);
        }).finally(function () {
            db.close();
        });
    }).catch(function (err) {
        return null;
    });
};
Orb.prototype.put = function (pathname, data) {
    var entries = this.collection;
    var entry = memory.Entry.fromValue(pathname, data);
    return async(mongodb, "connect")(this.uri).then(function (db) {
        return async(db, "collection")(entries).then(function (collection) {
            var query = {pathname: pathname};
            var doc = entry.toObject();
            return async(collection, "update")(query, doc, {upsert: true});
        }).then(function (doc) {
            return entry;
        }).finally(function () {
            db.close();
        });
    }).catch(function (err) {
        return null;
    });
};

// convert method with callback to promise function as:
//  obj.method(args..., function (err, result) {}) =>
//  async(obj, "method")(args...).then(function (result) {}, function (err) {})
var async = function (obj, name) {
    return function () {
        var d = q.defer();
        var args = Array.prototype.slice.call(arguments);
        args.push(function (err, result) {
            if (err) d.reject(err);
            d.resolve(result);
        });
        obj[name].apply(obj, args);
        return d.promise;
    };
};

exports.Orb = Orb;
