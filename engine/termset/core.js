"use strict";

//[relations]
// Engine - EngineGlossary -* TermSet
// Entity - EntityGlossary -* TermBinder
// TermSet -* TermBinder

const TermBinder = function TermBinder() {
    return Object.create(TermBinder.prototype, {});
};
TermBinder.prototype.entityAttr = function (entity, key) {
    return "";
};
TermBinder.prototype.entityLinkAll = function (entity) {
    return [];
};
TermBinder.prototype.linkAttr = function (link, key) {
    return "";
};

const TermSet = function TermSet(name) {
    return Object.create(TermSet.prototype, {
        name: {value: name, enumerable: true},
        binders: {value: {}}
    });
};
TermSet.prototype.get = function (type) {
    return this.binders[type];
};
TermSet.prototype.put = function (type, binder) {
    this.binders[type] = binder;
};

const EngineGlossary = function EngineGlossary() {
    return Object.create(EngineGlossary.prototype, {
        sets: {value: []}
    });
};
EngineGlossary.prototype.add = function (termSet) {
    this.sets.unshift(termSet);
};
EngineGlossary.prototype.remove = function (termSet) {
    const index = this.sets.indexOf(termSet);
    if (index >= 0) this.sets.splice(index, 1);
};
EngineGlossary.prototype.binderList = function (contentType) {
    return this.sets.reduce((binders, termSet) => {
        const binder = termSet.get(contentType);
        if (binder) binders.push(binder);
        return binders;
    }, []);
};

const EntityGlossary = function EntityGlossary(contentType, engineGlossary) {
    return Object.create(EntityGlossary.prototype, {
        contentType: {value: contentType},
        parent: {value: engineGlossary},
        binders: {value: []}
    });
};
EntityGlossary.prototype.add = function (binder) {
    this.binders.unshift(binder);
};
EntityGlossary.prototype.binderList = function () {
    const list = this.parent.binderList(this.contentType).concat(this.binders);
    return list.length === 0 ? this.parent.binderList("*") : list;
};
EntityGlossary.prototype.entityAttr = function (entity, key) {
    for (let binder of this.binderList()) {
        const value = binder.entityAttr(entity, key);
        if (value) return value;
    }
    return "";
};
EntityGlossary.prototype.entityLinkAll = function (entity) {
    for (let binder of this.binderList()) {
        const value = binder.entityLinkAll(entity);
        if (value.length) return value;
    }
    return [];
};
EntityGlossary.prototype.linkAttr = function (link, key) {
    for (let binder of this.binderList()) {
        const value = binder.linkAttr(link, key);
        if (value) return value;
    }
    return "";
};


exports.TermBinder = TermBinder;
exports.TermSet = TermSet;
exports.EngineGlossary = EngineGlossary;
exports.EntityGlossary = EntityGlossary;
