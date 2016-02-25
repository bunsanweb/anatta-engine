"use strict";

const jsdom = require("jsdom");
const xmldom = require("xmldom");
const nwmatcher = require("nwmatcher");

const xmlParser = new xmldom.DOMParser();
const xmlImpl = new xmldom.DOMImplementation();
const xmlSerializer = new xmldom.XMLSerializer();

// compat function for "document.implementation.createHTMLDocument"
exports.createHTMLDocument = (title) => {
    const html = jsdom.jsdom("<!doctype html>", {
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false
        }});
    if (typeof title === "string") {
        html.title = title;
    }
    return html;
};

// compat function for "document.implementation.createDocument"
exports.createDocument = () => {
    const xml = xmlImpl.createDocument();
    return xml;
};

exports.parseHTML = (src, uri) => {
    const html = jsdom.jsdom(src, {
        parsingMode: "html",
        url: uri,
        features: {
            FetchExternalResource: false,
            ProcessExternalResources: false
        }});
    return html;
};
exports.parseXML = (src, uri) => {
    const xml = xmlParser.parseFromString(src);
    xml.defaultView = {document: xml};
    xml.defaultView.matcher = nwmatcher(xml.defaultView);
    xml.documentURI = uri;
    return xml;
};


// compat object for XMLSerializer
const XMLSerializer = exports.XMLSerializer = function () {
    return Object.create(XMLSerializer.prototype);
};
XMLSerializer.prototype.serializeToString = function (node) {
    const doc = node.ownerDocument ? node.ownerDocument : node;
    if (doc.implementation.createHTMLDocument) {
        return jsdom.serializeDocument(node);
    } else {
        return xmlSerializer.serializeToString(node);
    }
};
