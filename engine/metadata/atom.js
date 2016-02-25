"use strict";

const core = require("./core");
const jsdom = require("./jsdom");
const termset = {
    core: require("../termset/core")
};

const Entity = function AtomEntity(engine, request, response) {
    const atom = jsdom.parseXML(response.text(), request.href);
    return Object.create(AtomEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "application/atom+xml", engine.glossary)},
        request: {value: request},
        response: {value: response},
        atom: {value: atom}
    });
};
Entity.prototype = core.Entity();
Entity.prototype.select = function (selector) {
    if (!selector) return [this.atom];
    const doc = this.atom.ownerDocument ? this.atom.ownerDocument : this.atom;
    return doc.defaultView.matcher.select(selector, this.atom);
};

const Link = function AtomLink(engine, atom, parent) {
    return Object.create(AtomLink.prototype, {
        engine: {value: engine},
        atom: {value: atom},
        parent: {value: parent}
    });
};
Link.prototype = core.Link();
Link.prototype.select = Entity.prototype.select;


exports.Link = Link;
exports.Entity = Entity;
