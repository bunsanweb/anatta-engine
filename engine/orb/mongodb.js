"use strict";

const mongodb = require("mongodb");
const memory = require("./memory");

// replacement for q's p.finally(proc)
const fin = (p, proc) => p.then(v => {
    try {proc();} catch (err) {}
    return v;
}, e => {
    try {proc();} catch (err) {}
    throw e;
});


const states = new WeakMap();
const Orb = class Orb {
    static new(uri, collection) {
        return Object.freeze(new Orb(uri, collection));
    }
    constructor(uri, collection) {
        uri = uri || "mongodb://localhost/mongorb";
        states.set(this, {uri, collection});
    }
    entryList() {
        const self = states.get(this);
        return mongodb.connect(self.uri).then(
            db => fin(db.collection(self.collection).then(
                collection => collection.find().toArray()
            ).then(docs => docs.reduce((result, doc) => Object.assign(result, {
                [doc.pathname]: memory.Entry.fromObject(doc)
            }), {})), () => db.close())
        ).catch(err => ({}));
    }
    get(pathname) {
        const self = states.get(this);
        return mongodb.connect(self.uri).then(
            db => fin(db.collection(self.collection).then(
                collection => collection.findOne({pathname})
            ).then(doc => memory.Entry.fromObject(doc)), () => db.close())
        ).catch(err => null);
    }
    put(pathname, data) {
        const self = states.get(this);
        const entry = memory.Entry.fromValue(pathname, data);
        return mongodb.connect(self.uri).then(
            db => fin(db.collection(self.collection).then(collection => {
                const query = {pathname};
                const doc = entry.toObject();
                return collection.update(query, doc, {upsert: true});
            }).then(doc => entry), () => db.close())
        ).catch(err => null);
    }
};

exports.Orb = Orb.new;
