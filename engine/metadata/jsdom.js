"use strict";

const jsdom = require("jsdom");
const xmldom = require("xmldom");
const nwmatcher = require("nwmatcher");

const xmlParser = new xmldom.DOMParser();
const xmlImpl = new xmldom.DOMImplementation();
const xmlSerializer = new xmldom.XMLSerializer();

// compat function for "document.implementation.createHTMLDocument"
exports.createHTMLDocument = (title) => {
    const dom = new jsdom.JSDOM("<!doctype html>", {
        virtualConsole: new jsdom.VirtualConsole().sendTo(console),
    });
    const html = dom.window.html;
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
    const dom = new jsdom.JSDOM(src, {
        url: uri,
        virtualConsole: new jsdom.VirtualConsole().sendTo(console),
    });
    const html = dom.window.document;
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
const XMLSerializer = class XMLSerializer {
    serializeToString(node) {
        const doc = node.ownerDocument ? node.ownerDocument : node;
        if (doc.implementation.createHTMLDocument) {
            return node === doc ? doc.documentImplementation.outerHTML :
              node.outerHTML;
        }
        return xmlSerializer.serializeToString(node);
    }
};
exports.XMLSerializer = function Serializer() {
    return new XMLSerializer();
};
