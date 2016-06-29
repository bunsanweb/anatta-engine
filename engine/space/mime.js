"use strict";

const path = require("path");
const fs = require("fs");

const presetMimeTypes = {
    js: "application/javascript",
    json: "application/json",
    html: "text/html",
    xml: "application/xml",
    atom: "application/atom+xml",
    css: "text/css",
    png: "image/png"
};

const mimeTypesFromFile = (pathname, mimeTypes) => {
    const body = fs.readFileSync(pathname, "utf-8");
    return body.split(/\n/).reduce((mimeTypes, line) => {
        const entry = line.replace(/#.*$/, "").trim().split(/\s+/);
        const type = entry[0];
        entry.slice(1).forEach(ext => {mimeTypes[ext] = type;});
        return mimeTypes;
    }, mimeTypes || {});
};


const loadSystemMimeTypes = () => {
    const pathnames = [
        "/etc/mime.types",
        "/etc/httpd/mime.types",
        "/etc/apache2/mime.types",
    ];
    for (const mimepath of pathnames) {
        try {
            return mimeTypesFromFile(mimepath);
        } catch (err) {}
    }
    return {};
};

// initialize
const mimeTypes = loadSystemMimeTypes();
Object.keys(presetMimeTypes).forEach(
    key => {mimeTypes[key] = presetMimeTypes[key];});

function contentType(pathname, charset) {
    const ext = path.extname(pathname).substring(1);
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    if (!mimeType.startsWith("text/")) return mimeType;
    return `${mimeType}; charset=${charset || "UTF-8"}`;
}
exports.contentType = contentType;
