"use strict";

const http = require("http");
const url = require("url");
const iconv = require("iconv");
const conftree = require("../conftree");

const Request = function Request(method, uri, headers, body, from) {
    headers = normalizeHeaders(headers || {});
    body = new Buffer(body || []);
    if (body.length && !headers["content-length"]) {
        headers["content-length"] = body.length.toString();
    }
    return Object.create(Request.prototype, {
        method: {value: method.toUpperCase(), enumerable: true},
        href: {value: uri, enumerable: true},
        location: {value: url.parse(uri, true, true), enumerable: true},
        headers: {value: headers, enumerable: true},
        body: {get: () => new Buffer(body), enumerable: true},
        from: {value: from}
    });
};
// NOTE: for compatibility
Request.prototype = {
    get uri() {return this.href;},
    get uriObject() {return this.location;}
};
Request.prototype.contentType = function () {
    return ContentType(this.headers["content-type"]);
};
Request.prototype.step = function () {
    return this.from ? 1 + this.from.step() : 0;
};
Request.prototype.origin = function () {
    return this.from ? this.from.origin() : this;
};
Request.prototype.text = function (charset) {
    const type = this.contentType();
    charset = charset || type.parameter.charset || "binary";
    return this.body.toString(charset);
};

const Response = function Response(status, headers, body) {
    status = status.toString();
    headers = normalizeHeaders(headers || {});
    body = new Buffer(body || []);
    if (body.length) {
        headers["content-length"] = body.length.toString();
    }
    const statusText = http.STATUS_CODES[status];
    return Object.create(Response.prototype, {
        status: {value: status, enumerable: true},
        statusText: {value: statusText, enumerable: true},
        headers: {value: headers, enumerable: true},
        body: {get: () => new Buffer(body), enumerable: true}
    });
};
Response.prototype.contentType = function () {
    return ContentType(this.headers["content-type"]);
};
Response.prototype.text = function (charset) {
    const type = this.contentType();
    charset = charset || type.parameter.charset || "binary";
    try {
        return this.body.toString(charset);
    } catch (ex) {
        const converter = new iconv.Iconv(charset, "utf-8");
        return converter.convert(this.body).toString();
    }
};

const Space = function Space(opts) {
    opts = conftree.create(opts, {redirectMax: 5});
    return Object.create(Space.prototype, {
        opts: {value: opts, enumerable: true},
        manager: {value: FieldManager(), enumerable: true}
    });
};
Space.prototype.request = Request;
Space.prototype.response = Response;
Space.prototype.access = function (request) {
    const redirector = (reqres) => {
        const request = reqres[0], response = reqres[1];
        const status = response.status.toString()[0];
        if ((status === "3" || (request.method === "PUT" && status == "2")) &&
            response.headers["location"] &&
            request.step() < this.opts.redirectMax) {
            const redirect = Request(
                "GET", response.headers["location"],
                request.headers, request.body, request);
            return this.access(redirect);
        } else {
            return Promise.all([request, response]);
        }
    };
    const field = this.manager.resolve(request);
    return Promise.resolve(field.access(request)).then(
        a => Promise.all(a)).then(redirector);
};

const FieldUtils = {
    error: (request, error, errorStatus) => {
        const body = new Buffer((error || new Error()).toString());
        const response = Response(errorStatus || "400", {
            "content-type": "text/plain;charset=utf-8",
            "content-length": body.length.toString()
        }, body);
        return Promise.all([request, response]);
    }
};


const UnknownField = Object.freeze({
    access: (request) => FieldUtils.error(
        request, `Resource not found: ${request.href}`, "404")
});


const FieldManager = function FieldManager() {
    return Object.create(FieldManager.prototype, {
        factories: {value: {}},
        fields: {value: {}}
    });
};
FieldManager.prototype.register = function (id, prefix, ctor) {
    this.factories[id] = {prefix: prefix, ctor: ctor};
    return id;
};
FieldManager.prototype.bind = function (id, prefix, field) {
    this.fields[id] = {prefix: prefix, field: field};
    return id;
};
FieldManager.prototype.build = function (factoryId, name, args) {
    const factory = this.factories[factoryId];
    if (!factory) return null;
    const fid = `${factoryId}${name ? name + "/" : ""}`;
    const prefix = `${factory.prefix}${name ? name + "/" : ""}`;
    const field = factory.ctor.apply(null, args);
    return this.bind(fid, prefix, field);
};
FieldManager.prototype.resolve = function (request) {
    const fields = this.fields;
    //reversed dict order for resolve (longer prefix one is adopted)
    const detailPrefixFirst = Object.keys(fields).map(id => fields[id]).sort(
        (a, b) => a.prefix > b.prefix ? -1 : 1);
    for (let field of detailPrefixFirst) {
        if (request.href.startsWith(field.prefix)) return field.field;
    }
    return UnknownField;
};

const normalizeHeaders = (headers) => Object.keys(headers).reduce((o, key) => {
    o[key.toLowerCase()] = headers[key];
    return o;
}, {});

const ContentType = function ContentType(full) {
    full = full || "application/octet-stream";
    // TBD: quated string value
    const list = full.split(";");
    const content = list[0].toLowerCase();
    const detail = content.split("/");
    const parameter = list.slice(1).reduce((params, param) => {
        const kv = param.split("=");
        params[kv[0].trim().toLowerCase()] = kv[1].trim();
        return params;
    }, {});
    return Object.create(ContentType.prototype, {
        full: {value: full, enumerable: true},
        value: {value: content, enumerable: true},
        parameter: {value: Object.freeze(parameter), enumerable: true},
        type: {value: detail[0], enumerable: true},
        subtype: {value: detail[1], enumerable: true}
    });
};
ContentType.prototype.valueOf = function () {
    return this.value;
};
ContentType.prototype.toString = function () {
    return this.full;
};


exports.Request = Request;
exports.Response = Response;
exports.ContentType = ContentType;
exports.Space = Space;
exports.FieldUtils = FieldUtils;
exports.UnknownField = UnknownField;
