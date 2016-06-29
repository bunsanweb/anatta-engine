"use strict";

const core = require("./core");
const jsdom = require("./jsdom");
const termsetCore = require("../termset/core");

const states = new WeakMap();
const select = (atom, selector) => {
    if (!selector) return [atom];
    const doc = atom.ownerDocument ? atom.ownerDocument : atom;
    return doc.defaultView.matcher.select(selector, atom);
};

const AtomEntity = class AtomEntity extends core.Entity {
    static new(engine, request, response) {
        return Object.freeze(new AtomEntity(engine, request, response));
    }
    constructor(engine, request, response) {
        super();
        const atom = jsdom.parseXML(response.text(), request.href);
        const glossary = termsetCore.EntityGlossary(
            "application/atom+xml", engine.glossary);
        states.set(this, {engine, glossary, request, response, atom});
    }
    get engine() {return states.get(this).engine;}
    get glossary() {return states.get(this).glossary;}
    get request() {return states.get(this).request;}
    get response() {return states.get(this).response;}
    get atom() {return states.get(this).atom;}
    select(selector) {return select(this.atom, selector);}
};

const AtomLink = class AtomLink extends core.Link {
    static new(engine, atom, parent) {
        return Object.freeze(new AtomLink(engine, atom, parent));
    }
    constructor(engine, atom, parent) {
        super();
        states.set(this, {engine, atom, parent});
    }
    get engine() {return states.get(this).engine;}
    get atom() {return states.get(this).atom;}
    get parent() {return states.get(this).parent;}
    select(selector) {return select(this.atom, selector);}
};

exports.Link = AtomLink.new;
exports.Entity = AtomEntity.new;
