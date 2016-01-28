"use strict";

const jsdom = require("jsdom");

// compat function for "document.implementation.createHTMLDocument"
exports.createHTMLDocument = function (title) {
    const html = jsdom.jsdom("<!doctype html>", {
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
    const xml = jsdom.jsdom("", {
        parsingMode: "xml",
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false,
        }});
    return xml;
};

exports.parseHTML = function (src, uri) {
    //NOTE: `uri` option absolute url only (e.g. no file:./...)
    const html = jsdom.jsdom(src, {
        parsingMode: "html",
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false,
        }});
    html.defaultView.location.href = uri;
    return html;
};
exports.parseXML = function (src, uri) {
    //NOTE: `uri` option absolute url only (e.g. no file:./...)
    const xml = jsdom.jsdom(src, {
        parsingMode: "xml",
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false,
        }});
    xml.defaultView.location.href = uri;
    return xml;
};


// compat object for XMLSerializer
const XMLSerializer = exports.XMLSerializer = function () {
    return Object.create(XMLSerializer.prototype);
};
XMLSerializer.prototype.serializeToString = function (node) {
    return jsdom.serializeDocument(node);
};
