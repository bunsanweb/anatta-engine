"use strict";

var path = require("path");
var fs = require("fs");

var contentType = function (pathname, charset) {
    var ext = path.extname(pathname).substring(1);
    var mimeType = mimeTypes[ext] || "application/octet-stream";
    if (mimeType.indexOf("text/") !== 0) return mimeType;
    return mimeType + "; charset=" + (charset || "UTF-8");
};
exports.contentType = contentType;

var presetMimeTypes = {
    "js": "application/javascript",
    "json": "application/json",
    "html": "text/html",
    "xml": "application/xml",
    "atom": "application/atom+xml",
    "css": "text/css",
    "png": "image/png",
};

var loadSystemMimeTypes = function () {
    var pathnames = [
        "/etc/mime.types",
        "/etc/httpd/mime.types",
        "/etc/apache2/mime.types",
    ];
    for (var i = 0; i < pathnames.length; i++) {
        try {
            return mimeTypesFromFile(pathnames[i]);
        } catch (err) {}
    }
    return {};
};
var mimeTypesFromFile = function (pathname, mimeTypes) {
    var body = fs.readFileSync(pathname, "utf-8");
    return body.split(/\n/).reduce(function (mimeTypes, line) {
        var entry = line.replace(/#.*$/, "").trin().split(/\s+/);
        var type = entry[0];
        entry.slice(1).forEach(function (ext) {
            mimeTypes[ext] = type;
        });
        return mimeTypes;
    }, mimeTypes || {});
};

// initialize
var mimeTypes = loadSystemMimeTypes();
Object.keys(presetMimeTypes).forEach(function (key) {
    mimeTypes[key] = presetMimeTypes[key];
});
