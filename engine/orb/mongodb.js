"use strict";

const mongodb = require("mongodb");
const memory = require("./memory");

const Orb = function Orb(uri, collection) {
    return Object.create(Orb.prototype, {
        uri: {value: uri || "mongodb://localhost/mongorb", enumerable: true},
        collection: {value: collection || "entries", enumerable: true}
    });
};
Orb.prototype.entryList = function () {
    return async(mongodb, "connect")(this.uri).then(
        db => fin(async(db, "collection")(this.collection).then(
            collection => async(collection.find(), "toArray")()
        ).then(docs => docs.reduce((result, doc) => {
            result[doc.pathname] = memory.Entry.fromObject(doc);
            return result;
        }, {})), () => db.close())
    ).catch(err => ({}));
};
Orb.prototype.get = function (pathname) {
    return async(mongodb, "connect")(this.uri).then(
        db => fin(async(db, "collection")(this.collection).then(
            collection => async(collection, "findOne")({pathname: pathname})
        ).then(doc => memory.Entry.fromObject(doc)), () => db.close())
    ).catch(err => null);
};
Orb.prototype.put = function (pathname, data) {
    const entry = memory.Entry.fromValue(pathname, data);
    return async(mongodb, "connect")(this.uri).then(
        db => fin(async(db, "collection")(this.collection).then(collection => {
            const query = {pathname: pathname};
            const doc = entry.toObject();
            return async(collection, "update")(query, doc, {upsert: true});
        }).then(doc => entry), () => db.close())
    ).catch(err => null);
};

// convert method with callback to promise function as:
//  obj.method(args..., function (err, result) {}) =>
//  async(obj, "method")(args...).then(function (result) {}, function (err) {})
const async = (obj, name) => () => {
    const args = Array.from(arguments); //[ES6] rest parameters
    return new Promise((f, r) => {
        args.push((err, result) => void(err ? r(err) : f(result))); 
        obj[name].apply(obj, args);
    });
};

// replacement for q's p.finally(proc)
const fin = (p, proc) => {
    return p.then(v => {
        try {proc();} catch (err) {}
        return v;
    }, e => {
        try {proc();} catch (err) {}
        throw e;
    });
};

exports.Orb = Orb;
