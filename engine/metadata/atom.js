var core = require("./core");
var jsdom = require("./jsdom");

var atomAttrs = {
    feed: {
        justone: ["id", "title", "updated"],
        option: ["rights", "icon", "generator", "logo", "subtitle"],
        many: ["author", "category", "contributor",],
    },
    entry: {
        justone: ["id", "title", "updated"],
        option: ["content", "published", "rights", "summary"],
        many: ["author", "category", "contributor",],
    },
    source: {
        justone: [],
        option: ["id", "title", "updated",
                 "rights", "icon", "generator", "logo", "subtitle"],
        many: ["author", "category", "contributor",],
    },
};


var Entity = function AtomEntity(engine, request, response) {
    var atom = jsdom.createDocument();
    atom.innerHTML = response.body.toString();
    return Object.create(AtomEntity.prototype, {
        engine: {value: engine},
        request: {value: request},
        response: {value: response},
        atom: {value: atom},
    });
};
Entity.prototype = core.Entity();
Entity.prototype.attr = function (key) {
    var v = core.Entity.prototype.attr.call(this, key);
    if (v) return v;
    var elem = atomAttrs.feed;
    if (elem.justone.indexOf(key) >= 0) {
        var elem = this.atom.querySelector("feed > " + key);
        return elem ? elem.textContent : "";
    }
    if (elem.option.indexOf(key) >= 0 || elem.many.indexOf(key) >= 0) {
        var elem = this.atom.querySelector("feed > " + key);
        if (elem) return elem.textContent;
    }
    var elem = this.atom.querySelector(
        "feed > link[rel='" + key + "']");
    if (elem) {
        href = elem.getAttribute("href");
        if (href) return href;
        return elem.textContent;
    }
    return "";
};
Entity.prototype.all = function () {
    return Array.prototype.slice.call(this.atom.querySelectorAll(
        "feed > entry")).map(function (entry) {
            return Link(this.engine, entry, this);
        }, this);
};

var Link = function AtomLink(engine, atom, parent) {
    return Object.create(AtomLink.prototype, {
        engine: {value: engine},
        atom: {value: atom},
        parent: {value: parent},
    });
};
Link.prototype = core.Link();
Link.prototype.attr = function (key) {
    var elem = atomAttrs.entry;
    if (key === "href") {
        var elem = this.atom.querySelector("feed > entry > link[rel='self']");
        if (elem) return elem.getAttribute("href");
    }
    
    if (elem.justone.indexOf(key) >= 0) {
        var elem = this.atom.querySelector("feed > entry > " + key);
        return elem ? elem.textContent : "";
    }
    if (elem.many.indexOf(key) >= 0 || elem.option.indexOf(key) >= 0) {
        var elem = this.atom.querySelector("feed > entry > " + key);
        return elem ? elem.textContent : "";
    }
    var elem = this.atom.querySelector(
        "feed > entry > link[rel='" + key + "']");
    if (elem) {
        href = elem.getAttribute("href");
        if (href) return href;
        return elem.textContent;
    }
    return "";
};


exports.Link = Link;
exports.Entity = Entity;
