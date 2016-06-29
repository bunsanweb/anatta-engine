"use strict";

/*
JSON Desciption TermSet example:

{
  "name": "activity-target",
  "uri-pattern": "^http://example.com/",
  "content-type": "text/html",
  "entity": {
    "title": {"selector": "head title", "value": "textContent"},
    "author": {"text": "Example.com"},
    "description": {"selector": "body p", "index": 0, "value": "textContent"},
    "link": {"selector": "article"}
  },
  "link"; {
    "href": {"selector": "a.activity", "value": "textContent"}
  }
}

*/

const core = require("./core");


const states = new WeakMap();
const JsonDescBinder = class JsonDescBinder extends core.TermBinder {
    static new(json) {return Object.freeze(new JsonDescBinder(json));}
    constructor(json) {
        super();
        states.set(this, {
            desc: json, name: json.name || "",
            uriParrern: RegExp(json["uri-pattern"]),
            contentType: json["content-type"]});
    }
    get desc() {return states.get(this).desc;}
    get name() {return states.get(this).name;}
    get uriPattern() {return states.get(this).uriPattern;}
    get contentType() {return states.get(this).contentType;}
    entityAttr(entity, key) {
        if (!entity.request.href.match(this.uriPattern)) return "";
        const binders = this.desc.entity || {};
        const desc = binders[key];
        if (!desc) return "";
        if (desc.text) return desc.text.toString();
        const selector = desc.selector || "";
        const index = desc.index || 0;
        const selected = entity.select(selector);
        if (selected.length <= index) return "";
        const elem = selected[index];
        const ret = desc.value ? elem[desc.value] : elem.valueOf().toString();
        return ret || "";
    }
    entityLinkAll(entity) {
        if (!entity.request.href.match(this.uriPattern)) return [];
        const binders = this.desc.entity || {};
        const desc = binders.link;
        if (!desc) return [];
        if (desc.text) return [];
        const selector = desc.selector || "";
        return entity.select(selector);
    }
    linkAttr(link, key) {
        if (!link.parent) return "";
        if (!link.parent.request.href.match(this.uriPattern)) return "";
        const binders = this.desc.link || {};
        const desc = binders[key];
        if (!desc) return "";
        if (desc.text) return desc.text.toString();
        const selector = desc.selector || "";
        const index = desc.index || 0;
        const selected = link.select(selector);
        if (selected.length <= index) return "";
        const elem = selected[index];
        const ret = desc.value ? elem[desc.value] : elem.valueOf().toString();
        return ret || "";
    }
};

const create = (json) => {
    const binder = JsonDescBinder.new(json);
    const termset = core.TermSet(binder.name);
    termset.put(binder.contentType, binder);
    return termset;
};

exports.create = create;
