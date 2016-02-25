"use strict";

//[core builtin termsets]
// supported terms:
// - "href": uri to the resource of the metadata
// - "content-type": content type of the content of the metadata
// - "body": the content data of the metadata
//
// link list enumeration:
// - JSON: child objects that include "href"
// - Atom: "entry" elements
// - HTML: "a" elements with "href"

const core = require("./core");
const jsdom = require("../metadata/jsdom");
const xmlSerializer = jsdom.XMLSerializer();

const ResourceBinder = function ResourceBinder() {
    return Object.create(ResourceBinder.prototype, {});
};
ResourceBinder.prototype = core.TermBinder();
ResourceBinder.prototype.entityAttr = function (entity, key) {
    if (key === "href") return entity.request.href;
    if (key === "content-type") {
        return entity.response.contentType().toString();
    }
    if (key === "body") return entity.response.text();
    return "";
};
ResourceBinder.prototype.linkAttr = function (link, key) {
    if (key === "href") return "";
    if (key === "content-type") {
        return "application/octet-stream";
    }
    if (key === "body") return "";
    return "";
};


const JsonBinder = function JsonBinder() {
    return Object.create(JsonBinder.prototype, {});
};
JsonBinder.prototype = ResourceBinder();
JsonBinder.prototype.entityLinkAll = function (entity) {
    if (typeof entity.json !== "object") return [];
    return Object.keys(entity.json).reduce((r, key) => {
        const v = entity.json[key];
        if (typeof v !== "object") return r;
        if (typeof v["href"] !== "string") return r;
        r.push(v);
        return r;
    }, []);
};
JsonBinder.prototype.linkAttr = function (link, key) {
    if (key === "href") return link.json["href"];
    if (key === "content-type") return "application/json";
    if (key === "body") return JSON.stringify(this.json);
    return "";
};

const AtomBinder = function AtomBinder() {
    return Object.create(AtomBinder.prototype, {});
};
AtomBinder.prototype = ResourceBinder();
AtomBinder.prototype.entityLinkAll = function (entity) {
    const doc = entity.atom.ownerDocument ? entity.atom.ownerDocument :
              entity.atom;
    const entries = doc.defaultView.matcher.select(
        "feed > entry", entity.atom);
    return Array.from(entries);
};
AtomBinder.prototype.linkAttr = function (link, key) {
    if (key === "href") {
        const doc = link.atom.ownerDocument ? link.atom.ownerDocument :
                  link.atom;
        const elem = doc.defaultView.matcher.select(
            "entry > link[rel='self']", link.atom)[0];
        return elem ? elem.getAttribute("href") : "";
    }
    if (key === "content-type") return "application/atom+xml";
    if (key === "body") return xmlSerializer.serializeToString(link.atom);
    return "";
};


const HtmlBinder = function HtmlBinder() {
    return Object.create(HtmlBinder.prototype, {});
};
HtmlBinder.prototype = ResourceBinder();
HtmlBinder.prototype.entityLinkAll = function (entity) {
    const entries = entity.html.querySelectorAll("[href], [src]");
    return Array.from(entries);
};
HtmlBinder.prototype.linkAttr = function (link, key) {
    if (key === "href") return link.html.href || link.html.src;
    if (key === "content-type") return "text/html;charset=utf-8";
    if (key === "body") return xmlSerializer.serializeToString(link.html);
    return "";
};

const termset = core.TermSet("buitiln");
termset.put("application/json", JsonBinder());
termset.put("application/atom+xml", AtomBinder());
termset.put("text/html", HtmlBinder());
termset.put("*", ResourceBinder());

exports.termset = termset;
