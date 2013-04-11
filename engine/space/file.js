"use strict";

var q = require("q");
var fs = require("fs");
var path = require("path");
var conftree = require("../conftree");
var core = require("./core");
var mime = require("./mime");
var cachecontrol = require("./cachecontrol");

var FileField = function FileField(opts) {
    return Object.create(FileField.prototype, {
        opts: {value: conftree.create(opts, {
            root: "", prefix: "",
            cache: false,
        })},
    });
};
FileField.prototype.access = function (request) {
    if (request.method !== "GET") {
        return q.resolve([request, core.Response("405", {allow: "GET"})]);
    }
    try {
        var prefix = RegExp("^" + this.opts.prefix);
        var relPath = request.location.pathname.replace(prefix, "");
        var pathname = path.resolve(this.opts.root, relPath);
        return getPath.call(this, request, pathname);
    } catch (ex) {
        if (ex.name === "AssertionError") throw ex;
        return core.FieldUtils.error(request, ex, "404");
    }
};

var getPath = function (request, pathname) {
    var self = this;
    var d = q.defer();
    fs.stat(pathname, function (err, stat) {
        if (err) {
            return d.resolve(core.FieldUtils.error(request, err, "404"));
        } else if (stat.isDirectory()) {
            return d.resolve(getIndex.call(self, request, pathname, stat));
        } else if (stat.isFile()) {
            return d.resolve(getContent.call(self, request, pathname, stat));
        }
        return d.reject(err);
    });
    return d.promise;
};

var getIndex = function (request, pathname, stat) {
    var self = this;
    var d = q.defer();
    fs.readdir(pathname, function (err, names) {
        if (err) return d.resolve(core.FieldUtil.error(request, "", "404"));
        for (var i = 0; i < names.length; i++) {
            if (!names[i].match(/^index\./)) continue;
            var indexPath = path.resolve(pathname, names[i]);
            return fs.stat(indexPath, function (err, stat) {
                if (err || !stat.isFile()) {
                    var reqres = core.FieldUtils.error(request, err, "404");
                    return d.resolve(reqres);
                }
                return d.resolve(
                    getContent.call(self, request, indexPath, stat));
            });
        }
        return d.resolve(core.FieldUtils.error(request, "", "404"));
    });
    return d.promise;
};

var getContent = function (request, pathname, stat) {
    var self = this;
    if (self.opts.cache &&
        cachecontrol.clientCacheValid(request, stat.mtime)) {
        return [request, cachecontrol.NotModified];
    }
    var d = q.defer();
    var type = mime.contentType(pathname);
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

/*
var notModified = function () {
    return core.Response("304", {}, "");
};
var clientCacheValid = function (request, stat) {
    var cc = parseCacheControl(request.headers["cacne-control"]);
    var since = request.headers["if-modified-since"];
    if (cc["no-cache"] || cc["no-store"] || !since) return false;
    var sinceDate = new Date(since);
    if (stat.mtime <= sinceDate) return true;
    return false;
};
var parseCacheControl = function (cachecontrol) {
    if (!cachecontrol) return {};
    var cc = {};
    cachecontrol.split(/;/).forEach(function (elem) {
        var kv = elem.split(/=/);
        cc[kv[0].trim().toLowerCase()] = kv[1] ? kv[1].trim() : true;
    });
    return cc;
};
*/

exports.FileField = FileField;
