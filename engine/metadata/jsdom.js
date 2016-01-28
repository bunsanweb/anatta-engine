"use strict";

const jsdom = require("jsdom");

// compat function for "document.implementation.createHTMLDocument"
exports.createHTMLDocument = function (title) {
    var html = jsdom.jsdom("<!doctype html>", {
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false,
        }});
    if (typeof title === "string") {
        html.title = title;
    }
    return html;
};

// compat function for "document.implementation.createDocument"
exports.createDocument = function () {
    var xml = jsdom.jsdom("", {
        parsingMode: "xml",
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false,
        }});
    return xml;
};

// compat object for XMLSerializer
var XMLSerializer = exports.XMLSerializer = function () {
    return Object.create(XMLSerializer.prototype);
};
XMLSerializer.prototype.serializeToString = function (node) {
    return jsdom.serializeDocument(node);
};
