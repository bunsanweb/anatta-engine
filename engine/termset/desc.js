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

const create = (json) => {
    const binder = JsonDescBinder(json);
    const termset = core.TermSet(binder.name);
    termset.put(binder.contentType, binder);
    return termset;
};

const JsonDescBinder = function JsonDescBinder(json) {
    return Object.create(JsonDescBinder.prototype, {
        desc: {value: json, enumerable: true},
        name: {value: json.name || "", enumerable: true},
        uriPattern: {value: RegExp(json["uri-pattern"]), enumerable: true},
        contentType: {value: json["content-type"], enumerable: true}
    });
};
JsonDescBinder.prototype = core.TermBinder();
JsonDescBinder.prototype.entityAttr = function (entity, key) {
    if (!entity.request.href.match(this.uriPattern)) return "";
    const binders = this.desc["entity"] || {};
    const desc = binders[key];
    if (!desc) return "";
    if (desc.text) return desc.text.toString();
    const selector = desc.selector || "";
    const index = desc.index || 0;
    const selected = entity.select(selector);
    if (selected.length <= index) return "";
    const elem = selected[index];
    return (desc.value ? elem[desc.value] : elem.valueOf().toString()) || "";
};
JsonDescBinder.prototype.entityLinkAll = function (entity) {
    if (!entity.request.href.match(this.uriPattern)) return [];
    const binders = this.desc["entity"] || {};
    const desc = binders["link"];
    if (!desc) return [];
    if (desc.text) return [];
    const selector = desc.selector || "";
    return entity.select(selector);
};
JsonDescBinder.prototype.linkAttr = function (link, key) {
    if (!link.parent) return "";
    if (!link.parent.request.href.match(this.uriPattern)) return "";
    const binders = this.desc["link"] || {};
    const desc = binders[key];
    if (!desc) return "";
    if (desc.text) return desc.text.toString();
    const selector = desc.selector || "";
    const index = desc.index || 0;
    const selected = link.select(selector);
    if (selected.length <= index) return "";
    const elem = selected[index];
    return (desc.value ? elem[desc.value] : elem.valueOf().toString()) || "";
};

exports.create = create;
