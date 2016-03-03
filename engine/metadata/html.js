"use strict";

const core = require("./core");
const jsdom = require("./jsdom");
const termsetCore = require("../termset/core");

const select = (html, selector) =>
          selector ? html.querySelectorAll(selector) : [html];

const states = new WeakMap();

const HtmlEntity = class HtmlEntity extends core.Entity {
    static new(engine, request, response) {
        return Object.freeze(new HtmlEntity(engine, request, response));
    }
    constructor (engine, request, response) {
        super();
        const html = jsdom.parseHTML(response.text(), request.href);
        const glossary = termsetCore.EntityGlossary(
            "text/html", engine.glossary);
        states.set(this, {engine, glossary, request, response, html});
    }
    get engine() {return states.get(this).engine;}
    get glossary() {return states.get(this).glossary;}
    get request() {return states.get(this).request;}
    get response() {return states.get(this).response;}
    get html() {return states.get(this).html;}
    select(selector) {return select(this.html, selector);}
};

const HtmlLink = class Link extends core.Link {
    static new(engine, html, parent) {
        return Object.freeze(new HtmlLink(engine, html, parent));
    }
    constructor (engine, html, parent) {
        super();
        states.set(this, {engine, html, parent});
    }
    get engine() {return states.get(this).engine;}
    get html() {return states.get(this).html;}
    get parent() {return states.get(this).parent;}
    select(selector) {return select(this.html, selector);}
};

exports.Link = HtmlLink.new;
exports.Entity = HtmlEntity.new;
