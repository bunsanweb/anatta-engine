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

var core = require("./core");
var jsdom = require("../metadata/jsdom");
var xmlSerializer = jsdom.XMLSerializer();

var ResourceBinder = function ResourceBinder() {
    return Object.create(ResourceBinder.prototype, {});
};
ResourceBinder.prototype = core.TermBinder();
ResourceBinder.prototype.entityAttr = function (entity, key) {
    if (key === "href") return entity.request.uri;
    if (key === "content-type") return entity.response.headers["content-type"];
    if (key === "body") return entity.response.body.toString();
    return "";
};


var JsonBinder = function JsonBinder() {
    return Object.create(JsonBinder.prototype, {});
};
JsonBinder.prototype = ResourceBinder();
JsonBinder.prototype.entityLinkAll = function (entity) {
    if (typeof entity.json !== "object") return [];
    return Object.keys(entity.json).reduce(function (r, key) {
        var v = entity.json[key];
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

var AtomBinder = function AtomBinder() {
    return Object.create(AtomBinder.prototype, {});
};
AtomBinder.prototype = ResourceBinder();
AtomBinder.prototype.entityLinkAll = function (entity) {
    var entries = entity.atom.querySelectorAll("feed > entry");
    return Array.prototype.map.call(entries, function (entry) {
        return entry;
    });
};
AtomBinder.prototype.linkAttr = function (link, key) {
    if (key === "href") {
        var elem = link.atom.querySelector("feed > entry > link[rel='self']");
        return elem ? elem.getAttribute("href") : "";
    }
    if (key === "content-type") return "application/atom+xml";
    if (key === "body") return xmlSerializer.serializeToString(link.atom);
    return "";
};


var HtmlBinder = function HtmlBinder() {
    return Object.create(HtmlBinder.prototype, {});
};
HtmlBinder.prototype = ResourceBinder();
HtmlBinder.prototype.entityLinkAll = function (entity) {
    var entries = entity.html.querySelectorAll("a[href]");
    return Array.prototype.map.call(entries, function (entry) {
        return entry;
    });
};
HtmlBinder.prototype.linkAttr = function (link, key) {
    if (key === "href") return link.html.href;
    if (key === "content-type") "text/html;charset=utf-8";
    if (key === "body") return xmlSerializer.serializeToString(link.html);
    return "";
};

var termset = core.TermSet("buitiln");
termset.put("application/json", JsonBinder());
termset.put("application/atom+xml", AtomBinder());
termset.put("text/html", HtmlBinder());
termset.put("*", ResourceBinder());

exports.termset = termset;