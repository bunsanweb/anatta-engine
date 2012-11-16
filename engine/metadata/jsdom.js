"use strict";

var jsdom = require("jsdom");
var features = jsdom.defaultDocumentFeatures = {
    FetchExternalResources: [],
    ProcessExternalResources: [],
    MutationEvents: false,
    QuerySelector: true,
};
var browser = jsdom.browserAugmentation(jsdom.dom.level3.html, {
    features: features,
});

// compat function for "document.implementation.createHTMLDocument"
var createHTMLDocument = exports.createHTMLDocument = function (title) {
    var html = jsdom.jsdom(
        "<!doctype html><html><head></head><body></body></html>",
        jsdom.dom.level3.html, {features: features});
    if (typeof title === "string") {
        var titleNode = html.createElement("title");
        titleNode.textContent = title;
        html.head.appendChild(titleNode);
    }
    if (!html.implementation.createHTMLDocument) {
        html.implementation.createHTMLDocument = createHTMLDocument;
    }
    return html;
};

// compat function for "document.implementation.createDocument"
var createDocument = exports.createDocument = function () {
    var xml = jsdom.jsdom(
        "", jsdom.dom.level3.core, {features: features});
    if (!xml.implementation.createDocument) {
        xml.implementation.createDocument = createDocument;
    }
    return xml;
};

// compat object for XMLSerializer
var XMLSerializer = exports.XMLSerializer = function () {
    return Object.create(XMLSerializer.prototype);
};
XMLSerializer.prototype.serializeToString = function (node) {
    return node.outerHTML;
};
