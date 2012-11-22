var core = require("./core");
var jsdom = require("./jsdom");

var Entity = function HtmlEntity(engine, request, response) {
    var html = jsdom.createHTMLDocument();
    html.innerHTML = response.body.toString();
    return Object.create(HtmlEntity.prototype, {
        engine: {value: engine},
        request: {value: request},
        response: {value: response},
        html: {value: html},
    });
};
Entity.prototype = core.Entity();
Entity.prototype.attr = function (key) {
    var v = core.Entity.prototype.attr.call(this, key);
    if (v) return v;
    // TBD: get metadata from HTML document
    // - any data in HTML5 "footer" element
    var root = this.html.documentElement;
    var attr = "";
    // meta[http-equiv] or meta[name]
    if (attr = attrAsMeta(root, key, "http-equiv")) return attr;
    if (attr = attrAsMeta(root, key, "name")) return attr;
    // *[rel] in footer
    if (attr = attrAsRelUnderFooter(root, key)) return attr;
    return "";
};
Entity.prototype.all = function () {
    // TBD: get link list from HTML document
    var root = this.html.documentElement;
    var alist = root.querySelectorAll("a[href]");
    return Array.prototype.map.call(alist, function (a) {
        return Link(this.engine, a, this);
    }, this);
};


var Link = function HtmlLink(engine, html, parent) {
    return Object.create(HtmlLink.prototype, {
        engine: {value: engine},
        html: {value: html},
        parent: {value: parent},
    });
};
Link.prototype = core.Link();
Link.prototype.attr = function (key) {
    // TBD: see Entity.prototype.attr
    var root = this.html;
    var attr = "";
    // *[xxx] or *[data-xxx]
    if (attr = attrAsElementAttr(root, key)) return attr;
    if (attr = attrAsElementAttr(root, "data-" + key)) return attr;
    // *[rel] in footer
    if (attr = attrAsRelUnderFooter(root, key)) return attr;
    return "";
};

// utilities

// HTML5 sectioning
// sectioning root: headings and footer, not forms outline
var sectioningRoots = [
    "body", "blockquote", "td", "details", "figure", "fieldset",
];
// sectioning content: headings and footer, forms outline
var sectioningContents = [
    "section", "article", "aside", "nav",
];

// find footer element for top sectioning of the elem
var findFooter = function (elem, inSection) {
    if (elem.tagName.toLowerCase() === "footer") return elem;
    for (var i = 0; i < elem.childNodes.length; i++) {
        var child = elem.childNodes[i];
        if (child.nodeType !== 1) continue;
        var tag = child.tagName.toLowerCase();
        if (sectioningRoots.indexOf(tag) >= 0 || 
            sectioningContents.indexOf(tag) >= 0) {
            if (inSection) continue; // skip
            return findFooter(child, true); // search footer only in it
        } else {
            var ret = findFooter(child, inSection);
            if (ret) return ret;
        }
    }
    return null;
};


// map attr as element attribute
var attrAsElementAttr = function (elem, key) {
    var value = elem.getAttribute(key);
    return value ? value : "";
};

// map attr as meta element
var attrAsMeta = function (elem, key, metaKey) {
    var meta = elem.querySelector("head meta[" + metaKey + "='" + key + "']");
    return meta ? meta.getAttribute("content") : "";
};

// map attr as *[rel] under footer element
var attrAsRelUnderFooter = function (elem, key) {
    var footer = findFooter(elem);
    if (footer) {
        var elem = footer.querySelector("[rel='" + key + "']");
        if (elem) return elem.textContent;
    }
    return "";
};


exports.Link = Link;
exports.Entity = Entity;

