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
    return mongodb.connect(this.uri).then(
        db => fin(db.collection(this.collection).then(
            collection => collection.find().toArray()
        ).then(docs => docs.reduce((result, doc) => {
            result[doc.pathname] = memory.Entry.fromObject(doc);
            return result;
        }, {})), () => db.close())
    ).catch(err => ({}));
};
Orb.prototype.get = function (pathname) {
    return mongodb.connect(this.uri).then(
        db => fin(db.collection(this.collection).then(
            collection => collection.findOne({pathname: pathname})
        ).then(doc => memory.Entry.fromObject(doc)), () => db.close())
    ).catch(err => null);
};
Orb.prototype.put = function (pathname, data) {
    const entry = memory.Entry.fromValue(pathname, data);
    return mongodb.connect(this.uri).then(
        db => fin(db.collection(this.collection).then(collection => {
            const query = {pathname: pathname};
            const doc = entry.toObject();
            return collection.update(query, doc, {upsert: true});
        }).then(doc => entry), () => db.close())
    ).catch(err => null);
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
