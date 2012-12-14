"use strict";

//[relations]
// Engine - EngineGlossary -* TermSet
// Entity - EntityGlossary -* TermBinder
// TermSet -* TermBinder

var TermBinder = function TermBinder() {
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

var TermSet = function TermSet(name) {
    return Object.create(TermSet.prototype, {
        name: {value: name, enumerable: true},
        binders: {value: {}},
    });
};
TermSet.prototype.get = function (type) {
    return this.binders[type];
};
TermSet.prototype.put = function (type, binder) {
    this.binders[type] = binder;
};

var EngineGlossary = function EngineGlossary() {
    return Object.create(EngineGlossary.prototype, {
        sets: {value: []},
    });
};
EngineGlossary.prototype.add = function (termSet) {
    this.sets.unshift(termSet);
};
EngineGlossary.prototype.remove = function (termSet) {
    var index = this.sets.indexOf(termSet);
    if (index >= 0) this.sets.splice(i, 1);
};
EngineGlossary.prototype.binderList = function (contentType) {
    var binders = [];
    this.sets.forEach(function (termSet) {
        var binder = termSet.get(contentType);
        if (binder) binders.push(binder);
    });
    return binders;
};

var EntityGlossary = function EntityGlossary(contentType, engineGlossary) {
    return Object.create(EntityGlossary.prototype, {
        contentType: {value: contentType},
        parent: {value: engineGlossary},
        binders: {value: []},
    });
};
EntityGlossary.prototype.add = function (binder) {
    this.binders.unshift(binder);
};
EntityGlossary.prototype.binderList = function () {
    return this.parent.binderList(this.contentType).concat(this.binders);
};
EntityGlossary.prototype.entityAttr = function (entity, key) {
    var binderList = this.binderList();
    for (var i = 0; i < binderList.length; i++) {
        var value = binderList[i].entityAttr(entity, key);
        if (value) return value;
    }
    return "";
};
EntityGlossary.prototype.entityLinkAll = function (entity) {
    var binderList = this.binderList();
    for (var i = 0; i < binderList.length; i++) {
        var value = binderList[i].entityLinkAll(entity);
        if (value.length) return value;
    }
    return [];
};
EntityGlossary.prototype.linkAttr = function (link, key) {
    var binderList = this.binderList();
    for (var i = 0; i < binderList.length; i++) {
        var value = binderList[i].linkAttr(link, key);
        if (value) return value;
    }
    return "";
};


exports.TermBinder = TermBinder;
exports.TermSet = TermSet;
exports.EngineGlossary = EngineGlossary;
exports.EntityGlossary = EntityGlossary;
