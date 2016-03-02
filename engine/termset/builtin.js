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

const ResourceBinder = class ResourceBinder extends core.TermBinder {
    static new() {return Object.freeze(new ResourceBinder());}
    entityAttr(entity, key) {
        switch (key) {
        case "href": return entity.request.href;
        case "content-type": return entity.response.contentType().toString();
        case "body": return entity.response.text();
        default: return "";
        }
    }
    linkAttr(link, key) {
        switch (key) {
        case "href": return "";
        case "content-type": return "application/octet-stream";
        case "body": return "";
        default: return "";
        }
    }
};

const JsonBinder = class JsonBinder extends ResourceBinder {
    static new() {return Object.freeze(new JsonBinder());}
    entityLinkAll (entity) {
        if (typeof entity.json !== "object") return [];
        return Object.keys(entity.json).reduce((r, key) => {
            const v = entity.json[key];
            if (typeof v !== "object") return r;
            if (typeof v["href"] !== "string") return r;
            r.push(v);
            return r;
        }, []);
    }
    linkAttr(link, key) {
        switch (key) {
        case "href": return link.json["href"];
        case "content-type": return "application/json";
        case "body": return JSON.stringify(this.json);
        default: return "";
        }
    }
};

const AtomBinder = class AtomBinder extends ResourceBinder {
    static new() {return Object.freeze(new AtomBinder());}
    entityLinkAll(entity) {
        const doc = entity.atom.ownerDocument ? entity.atom.ownerDocument :
                  entity.atom;
        const entries = doc.defaultView.matcher.select(
            "feed > entry", entity.atom);
        return Array.from(entries);
    }
    linkAttr(link, key) {
        switch (key) {
        case "href": {
            const doc = link.atom.ownerDocument ? link.atom.ownerDocument :
                      link.atom;
            const elem = doc.defaultView.matcher.select(
                "entry > link[rel='self']", link.atom)[0];
            return elem ? elem.getAttribute("href") : "";
        }
        case "content-type": return "application/atom+xml";
        case "body": return xmlSerializer.serializeToString(link.atom);
        default: return "";
        }
    }
};


const HtmlBinder = class HtmlBinder extends ResourceBinder {
    static new() {return Object.freeze(new HtmlBinder());}
    entityLinkAll(entity) {
        const entries = entity.html.querySelectorAll("[href], [src]");
        return Array.from(entries);
    }
    linkAttr(link, key) {
        switch (key) {
        case "href": return link.html.href || link.html.src;
        case "content-type": return "text/html;charset=utf-8";
        case "body": return xmlSerializer.serializeToString(link.html);
        default: return "";
        }
    }
};

const termset = core.TermSet("buitiln");
termset.put("application/json", JsonBinder.new());
termset.put("application/atom+xml", AtomBinder.new ());
termset.put("text/html", HtmlBinder.new());
termset.put("*", ResourceBinder.new());

exports.termset = termset;
