"use strict";

//[relations]
// Engine - EngineGlossary -* TermSet
// Entity - EntityGlossary -* TermBinder
// TermSet -* TermBinder

const states = new WeakMap();

const TermBinder = class TermBinder {
    static new() {return new TermBinder();}
    entirtAttr(entity, key) {return "";}
    entityLinkAll(entity) {return [];}
    linkAttr(link, key) {return "";}
};

const TermSet = class TermSet {
    static new(name) {return Object.freeze(new TermSet(name));}
    constructor (name) {states.set(this, {name, binders: []});}
    get name() {return states.get(this).name;}
    get(type) {return states.get(this).binders[type];}
    put(type, binder) {states.get(this).binders[type] = binder;}
};


const EngineGlossary = class EngineGlossary {
    static new() {return Object.freeze(new EngineGlossary());}
    constructor () {states.set(this, {sets: []});}
    add(termSet) {states.get(this).sets.unshift(termSet);}
    remove(termSet) {
        const self = states.get(this);
        const index = self.sets.indexOf(termSet);
        if (index >= 0) self.sets.splice(index, 1);
    }
    binderList(contentType) {
        const self = states.get(this);
        return self.sets.reduce((binders, termSet) => {
            const binder = termSet.get(contentType);
            if (binder) binders.push(binder);
            return binders;
        }, []);
    }
};

const EntityGlossary = class EntityGlossary {
    static new(contentType, engineGlossary) {
        return Object.freeze(new EntityGlossary(contentType, engineGlossary));
    }
    constructor (contentType, parent) {
        states.set(this, {contentType, parent, binders: []});
    }
    add(binder) {states.get(this).binders.unshift(binder);}
    binderList() {
        const self = states.get(this);
        const list = self.parent.binderList(self.contentType).concat(
            self.binders);
        return list.length === 0 ? self.parent.binderList("*") : list;
    }
    entityAttr(entity, key) {
        for (let binder of this.binderList()) {
            const value = binder.entityAttr(entity, key);
            if (value) return value;
        }
        return "";
    }
    entityLinkAll(entity) {
        for (let binder of this.binderList()) {
            const value = binder.entityLinkAll(entity);
            if (value.length) return value;
        }
        return [];
    }
    linkAttr (link, key) {
        for (let binder of this.binderList()) {
            const value = binder.linkAttr(link, key);
            if (value) return value;
        }
        return "";
    }
};

exports.TermBinder = TermBinder;
exports.TermSet = TermSet.new;
exports.EngineGlossary = EngineGlossary.new;
exports.EntityGlossary = EntityGlossary.new;
