"use strict";

const fs = require("fs");
const path = require("path");
const conftree = require("../conftree");
const core = require("./core");
const mime = require("./mime");
const cachecontrol = require("./cachecontrol");


const fallnext = (ps) => ps.slice(1).reduce((p, n) => p.catch(e => n), ps[0]);
const async = (obj, name) => function () {
    const args = Array.from(arguments); //[ES6] rest parameters
    return new Promise((f, r) => {
        args.push((err, result) => void(err ? r(err) : f(result)));
        obj[name].apply(obj, args);
    });
};
const fstat = async(fs, "stat");
const readdir = async(fs, "readdir");
const readFile = async(fs, "readFile");

const states = new WeakMap();
const FileField = class FileField {
    static new(opts) {return Object.freeze(new FileField(opts));}
    constructor (opts) {
        opts = conftree.create(opts, {root: "", prefix: "", cache: false});
        states.set(this, {opts});
    }
    access(request) {
        const self = states.get(this);
        if (request.method !== "GET") {
            const notAllowed = core.Response("405", {allow: "GET"});
            return Promise.all([request, notAllowed]);
        }
        try {
            const prefix = RegExp(`^${self.opts.prefix}`);
            const relPath = request.location.pathname.replace(prefix, "");
            const pathname = path.resolve(self.opts.root, relPath);
            return getPath(self, request, pathname);
        } catch (ex) {
            if (ex.name === "AssertionError") throw ex; //NOTE: for Test
            return Promise.all(core.FieldUtils.error(request, ex, "404"));
        }
    }
};


const getPath = (self, request, pathname) => fstat(pathname).then(stat => {
    if (stat.isDirectory()) {
        return getIndex(self, request, pathname, stat);
    } else if (stat.isFile()) {
        return getContent(self, request, pathname, stat);
    }
    throw Error("Not a File or Directory");
}).catch(err => core.FieldUtils.error(request, err, "404"));

// resolve directory index content: e.g. index.html
const getIndex = (self, request, pathname, stat) => readdir(pathname).then(
    names => fallnext(names.filter(n => n.match(/^index\./)).map(name => {
        const indexPath = path.resolve(pathname, name);
        return fstat(indexPath).then(stat => {
            if (stat.isFile()) {
                return getContent(self, request, indexPath, stat);
            }
            throw Error("No Index");
        });
    }))).catch(err => core.FieldUtil.error(request, "", "404"));

const getContent = (self, request, pathname, stat) => {
    if (self.opts.cache &&
        cachecontrol.clientCacheValid(request, stat.mtime)) {
        return Promise.all([request, cachecontrol.NotModified]);
    }
    return readFile(pathname).then(data => {
        const type = mime.contentType(pathname);
        const response = core.Response("200", {
            "content-type": type,
            "content-length": data.length.toString(),
            "last-modified": stat.mtime.toUTCString()
        }, data);
        return [request, response];
    }).catch(err => core.FieldUtil.error(request, "", "404"));
};


exports.FileField = FileField.new;
