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
    "description": {"selector": "body p", "index": 0, "value": "textContent"}
  },
  "link"; {}
}

*/

var core = require("./core");

var create = function (json) {
    var binder = JsonDescBinder(json);
    var termset = core.TermSet(binder.name);
    termset.put(binder.contentType, binder);
    return termset;
};

var JsonDescBinder = function JsonDescBinder(json) {
    return Object.create(JsonDescBinder.prototype, {
        desc: {value: json, enumerable: true},
        name: {value: json.name || "", enumerable: true},
        uriPattern: {value: RegExp(json["uri-pattern"]), enumerable: true},
        contentType: {value: json["content-type"], enumerable: true},
    });
};
JsonDescBinder.prototype = core.TermBinder();
JsonDescBinder.prototype.entityAttr = function (entity, key) {
    if (!entity.request.href.match(this.uriPattern)) return "";
    var binders = this.desc["entity"] || {};
    var desc = binders[key];
    if (!desc) return "";
    if (desc.text) return desc.text.toString();
    var selector = desc.selector || "";
    var index = desc.index || 0;
    var selected = entity.select(selector); // TBD: to impl
    if (selected.length <= index) return "";
    var elem = selected[index];
    return (desc.value ? elem[desc.value] : elem.valueOf().toString()) || "";
};
JsonDescBinder.prototype.entityLinkAll = function (entity) {
    if (!entity.request.href.match(this.uriPattern)) return [];
    var binders = this.desc["entity"] || {};
    var desc = binders["link"];
    if (!desc) return [];
    if (desc.text) return [];
    var selector = desc.selector || "";
    return entity.select(selector); // TBD: to impl
};
JsonDescBinder.prototype.linkAttr = function (link, key) {
    if (!link.parent) return "";
    if (!link.parent.request.href.match(this.uriPattern)) return "";
    var binders = this.desc["link"] || {};
    var desc = binders[key];
    if (!desc) return "";
    if (desc.text) return desc.text.toString();
    var selector = desc.selector || "";
    var index = desc.index || 0;
    var selected = link.select(selector); // TBD: to impl
    if (selected.length <= index) return "";
    var elem = selected[index];
    return (desc.value ? elem[desc.value] : elem.valueOf().toString()) || "";
};

exports.create = create;
