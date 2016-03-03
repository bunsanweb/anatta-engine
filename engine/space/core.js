"use strict";

const http = require("http");
const url = require("url");
const iconv = require("iconv");
const conftree = require("../conftree");

const states = new WeakMap();

const Request = class Request {
    static new(method, uri, headers, body, from) {
        return Object.freeze(new Request(method, uri, headers, body, from));
    }
    constructor (method, href, headers, body, from) {
        method = method.toUpperCase();
        headers = normalizeHeaders(headers || {});
        body = Buffer(body || []);
        if (body.length && !headers["content-length"]) {
            headers["content-length"] = body.length.toString();
        }
        const location = url.parse(href, true, true);
        states.set(this, {method, href, location, headers, body, from});
    }
    get method() {return states.get(this).method;}
    get href() {return states.get(this).href;}
    get location() {return states.get(this).location;}
    get headers() {return states.get(this).headers;}
    get body() {return Buffer(states.get(this).body);}
    get from() {return states.get(this).from;}
    contentType() {
        return ContentType.new(this.headers["content-type"]);
    }
    step() {return this.from ? 1 + this.from.step() : 0;}
    origin() {return this.from ? this.from.origin() : this;}
    text(charset) {return bodyText(this, charset);}
};

const Response = class Response {
    static new(status, headers, body) {
        return Object.freeze(new Response(status, headers, body));
    }
    constructor (status, headers, body) {
        status = status.toString();
        headers = normalizeHeaders(headers || {});
        body = Buffer(body || []);
        if (body.length) {
            headers["content-length"] = body.length.toString();
        }
        const statusText = http.STATUS_CODES[status];
        states.set(this, {status, statusText, headers, body});
    }
    get status() {return states.get(this).status;}
    get statusText() {return states.get(this).statusText;}
    get headers() {return states.get(this).headers;}
    get body() {return Buffer(states.get(this).body);}
    contentType() {
        return ContentType.new(this.headers["content-type"]);
    }
    text(charset) {return bodyText(this, charset);}
};

const bodyText = (r, charset) => {
    const type = r.contentType();
    charset = charset || type.parameter.charset || "binary";
    try {
        return r.body.toString(charset);
    } catch (ex) {
        const converter = new iconv.Iconv(charset, "utf-8");
        return converter.convert(r.body).toString();
    }    
};

const Space = class Space {
    static new(opts) {return Object.freeze(new Space(opts));}
    constructor (opts) {
        opts = conftree.create(opts, {redirectMax: 5});
        states.set(this, {opts, manager: FieldManager.new()});
    }
    get opts() {return states.get(this).opts;}
    get manager() {return states.get(this).manager;}
    request(method, uri, headers, body, from) {
        return Request.new(method, uri, headers, body, from);
    }
    response(status, headers, body) {
        return Response.new(status, headers, body);
    }
    access(request) {
        const field = this.manager.resolve(request);
        return Promise.resolve(field.access(request)).then(
            a => Promise.all(a)).then(reqres => redirector(this, reqres));
    }
};

const redirector = (space, reqres) => {
    const request = reqres[0], response = reqres[1];
    const status = response.status.toString()[0];
    if ((status === "3" || (request.method === "PUT" && status == "2")) &&
        response.headers["location"] &&
        request.step() < space.opts.redirectMax) {
        const redirect = Request.new(
            "GET", response.headers["location"],
            request.headers, request.body, request);
        return space.access(redirect);
    } else {
        return Promise.all([request, response]);
    }
};


const FieldUtils = {
    error: (request, error, errorStatus) => {
        const body = new Buffer((error || new Error()).toString());
        const response = Response.new(errorStatus || "400", {
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

const FieldManager = class FieldManager {
    static new() {return Object.freeze(new FieldManager());}
    constructor () {
        states.set(this, {factories: {}, fields: {}}); 
    }
    get fields() {return states.get(this).fields;} // for Test
    register(id, prefix, ctor) {
        states.get(this).factories[id] = {prefix: prefix, ctor: ctor};
        return id;
    }
    bind(id, prefix, field) {
        states.get(this).fields[id] = {prefix: prefix, field: field};
        return id;
    }
    build(factoryId, name, args) {
        const factory = states.get(this).factories[factoryId];
        if (!factory) return null;
        const fid = `${factoryId}${name ? name + "/" : ""}`;
        const prefix = `${factory.prefix}${name ? name + "/" : ""}`;
        const field = factory.ctor.apply(null, args);
        return this.bind(fid, prefix, field);
    }
    resolve(request) {
        const fields = states.get(this).fields;
        //reversed dict order for resolve (longer prefix one is adopted)
        const detailPrefixFirst = Object.keys(fields).map(
            id => fields[id]).sort((a, b) => a.prefix > b.prefix ? -1 : 1);
        for (let field of detailPrefixFirst) {
            if (request.href.startsWith(field.prefix)) return field.field;
        }
        return UnknownField;
    }
};

const normalizeHeaders = (headers) => Object.keys(headers).reduce((o, key) => {
    o[key.toLowerCase()] = headers[key];
    return o;
}, {});

const ContentType = class ContentType {
    static new(full) {return Object.freeze(new ContentType(full));}
    constructor (full) {
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
        const value = content, type = detail[0], subtype = detail[1];
        Object.assign(this, {full, value, parameter, type, subtype});
    }
    valueOf() {return this.value;}
    toString() {return this.full;}
};


exports.Request = Request.new;
exports.Response = Response.new;
exports.ContentType = ContentType.new;
exports.Space = Space.new;
exports.FieldUtils = FieldUtils;
exports.UnknownField = UnknownField;
