"use strict";

const core = require("./core");
const jsdom = require("./jsdom");
const termset = {
    core: require("../termset/core")
};


const Entity = function HtmlEntity(engine, request, response) {
    const html = jsdom.parseHTML(response.text(), request.href);
    return Object.create(HtmlEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "text/html", engine.glossary)},
        request: {value: request},
        response: {value: response},
        html: {value: html}
    });
};
Entity.prototype = core.Entity();
Entity.prototype.select = function (selector) {
    return selector ? this.html.querySelectorAll(selector) : [this.html];
};

const Link = function HtmlLink(engine, html, parent) {
    return Object.create(HtmlLink.prototype, {
        engine: {value: engine},
        html: {value: html},
        parent: {value: parent}
    });
};
Link.prototype = core.Link();
Link.prototype.select = Entity.prototype.select;


exports.Link = Link;
exports.Entity = Entity;
