"use strict";

const fs = require("fs");
const path = require("path");
const conftree = require("../conftree");
const core = require("./core");
const mime = require("./mime");
const cachecontrol = require("./cachecontrol");

const FileField = function FileField(opts) {
    return Object.create(FileField.prototype, {
        opts: {value: conftree.create(opts, {
            root: "", prefix: "", cache: false
        })}
    });
};
FileField.prototype.access = function (request) {
    if (request.method !== "GET") {
        return Promise.all([request, core.Response("405", {allow: "GET"})]);
    }
    try {
        const prefix = RegExp(`^${this.opts.prefix}`);
        const relPath = request.location.pathname.replace(prefix, "");
        const pathname = path.resolve(this.opts.root, relPath);
        return getPath(this, request, pathname);
    } catch (ex) {
        if (ex.name === "AssertionError") throw ex; //NOTE: for Test
        return Promise.all(core.FieldUtils.error(request, ex, "404"));
    }
};

const getPath = (self, request, pathname) => new Promise((f, r) => {
    fs.stat(pathname, (err, stat) => {
        if (err) return f(core.FieldUtils.error(request, err, "404"));
        if (stat.isDirectory()) {
            return f(getIndex(self, request, pathname, stat));
        } else if (stat.isFile()) {
            return f(getContent(self, request, pathname, stat));
        }
        return r(err);
    });
});

const getIndex = (self, request, pathname, stat) => new Promise((f, r) => {
    fs.readdir(pathname, (err, names) => {
        if (err) return f(core.FieldUtil.error(request, "", "404"));
        for (let name of names) {
            if (!name.match(/^index\./)) continue;
            const indexPath = path.resolve(pathname, name);
            return fs.stat(indexPath, (err, stat) => {
                if (err || !stat.isFile()) {
                    return f(core.FieldUtils.error(request, err, "404"));
                }
                return f(getContent(self, request, indexPath, stat));
            });
        }
        return f(core.FieldUtils.error(request, "", "404"));
    });
});

const getContent = (self, request, pathname, stat) => {
    if (self.opts.cache &&
        cachecontrol.clientCacheValid(request, stat.mtime)) {
        return Promise.all([request, cachecontrol.NotModified]);
    }
    return new Promise((f, r) => {
        const type = mime.contentType(pathname);
        fs.readFile(pathname, (err, data) => {
            if (err) return f(core.FieldUtil.error(request, "", "404"));
            const response = core.Response("200", {
                "content-type": type,
                "content-length": data.length.toString(),
                "last-modified": stat.mtime.toUTCString()
            }, data);
            return f([request, response]);
        });
    });
};

exports.FileField = FileField;
