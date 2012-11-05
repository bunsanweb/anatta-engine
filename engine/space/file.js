var q = require("q");
var fs = require("fs");
var path = require("path");
var core = require("./core");

var FileField = function (opts) {
    return Object.create(FileField.prototype, {
        opts: {value: opts},
    });
};
FileField.prototype.access = function (request) {
    if (request.method !== "GET") {
        return q.resolve([request, core.Response("405", {allow: "GET"})]);
    }
    try {
        var prefix = RegExp("^" + this.opts.prefix);
        var relPath = request.uriObject.pathname.replace(prefix, "");
        var pathname = path.resolve(this.opts.root, relPath);
        return getPath(request, pathname);
    } catch (ex) {
        if (ex.name === "AssertionError") throw ex;
        return core.FieldUtils.error(request, ex, "404");
    }
};

var getPath = function (request, pathname) {
    var d = q.defer();
    fs.stat(pathname, function (err, stat) {
        if (err) {
            return d.resolve(core.FieldUtils.error(request, err, "404"));
        } else if (stat.isDirectory()) {
            return d.resolve(getIndex(request, pathname, stat));
        } else if (stat.isFile()) {
            return d.resolve(getContent(request, pathname, stat));
        }
        return d.reject(err);
    });
    return d.promise;
};

var getIndex = function (request, pathname, stat) {
    var d = q.defer();
    fs.readdir(pathname, function (err, names) {
        if (err) return d.resolve(core.FieldUtil.error(request, "", "404"));
        for (var i = 0; i < names.length; i++) {
            if (names[i].match(/^index\./)) {
                var indexPath = path.resolve(pathname, names[i]);
                return d.resolve(getContent(request, indexPath, stat));
            }
        }
        return d.resolve(core.FieldUtil.error(request, "", "404"));
    });
    return d.promise;
};

var getContent = function (request, pathname, stat) {
    var d = q.defer();
    var type = contentType(pathname);
    fs.readFile(pathname, function (err, data) {
        if (err) return d.resolve(core.FieldUtil.error(request, "", "404"));
        var response = core.Response("200", {
            "content-type": type,
            "content-length": data.length.toString(),
            "last-modified": stat.mtime.toUTCString(),
        }, data);
        d.resolve([request, response]);
    });
    return d.promise;
};

var mimeTypes = {
    "js": "application/javascript",
    "json": "application/json",
    "html": "text/html",
    "xml": "application/xml",
    "atom": "application/atom+xml",
};

var contentType = function (pathname, charset) {
    var ext = path.extname(pathname).substring(1);
    var mimeType = mimeTypes[ext] || "application/octet-stream";
    if (mimeType.indexOf("text/") !== 0) return mimeType;
    return mimeType + "; charset=" + (charset || "UTF-8");
};

exports.FileField = FileField;
