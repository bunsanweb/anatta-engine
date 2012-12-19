"use strict";

var http = require("http");
var url = require("url");
var q = require("q");
var conftree = require("../conftree");

var Request = function Request(method, uri, headers, body, from) {
    headers = normalizeHeaders(headers || {});
    body = new Buffer(body || []);
    if (body.length && !headers["content-length"]) {
        headers["content-length"] = body.length.toString();
    }
    return Object.create(Request.prototype, {
        method: {value: method.toUpperCase(), enumerable: true},
        uri: {value: uri, enumerable: true},
        uriObject: {value: url.parse(uri, true, true), enumerable: true},
        headers: {value: headers, enumerable: true},
        body: {get: function () {return new Buffer(body)}, enumerable: true},
        from: {value: from},
    });
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


var Response = function Response(status, headers, body) {
    status = status.toString();
    var statusText = http.STATUS_CODES[status];
    headers = normalizeHeaders(headers || {});
    body = new Buffer(body || []);
    if (body.length) {
        headers["content-length"] = body.length.toString();
    }
    return Object.create(Response.prototype, {
        status: {value: status, enumerable: true},
        statusText: {value: statusText, enumerable: true},
        headers: {value: headers, enumerable: true},
        body: {get: function () {return new Buffer(body)}, enumerable: true},
    });
};
Response.prototype.contentType = function () {
    return ContentType(this.headers["content-type"]);
};

var Space = function Space(opts) {
    opts = conftree.create(opts, {redirectMax: 5});
    return Object.create(Space.prototype, {
        opts: {value: opts, enumerable: true},
        manager: {value: FieldManager(), enumerable: true},
    });
};
Space.prototype.request = Request;
Space.prototype.response = Response;
Space.prototype.access = function (request) {
    var self = this;
    var redirector = function (request, response) {
        var status = response.status.toString()[0];
        if ((status === "3" || (request.method === "PUT" && status == "2")) &&
            response.headers["location"] &&
            request.step() < self.opts.redirectMax) {
            var redirect = Request(
                "GET", response.headers["location"],
                request.headers, request.body, request);
            return self.access(redirect);
        } else {
            return q.resolve([request, response]);
        }
    };
    var field = this.manager.resolve(request);
    var deferred = q.defer();
    deferred.resolve(field.access(request));
    return deferred.promise.spread(redirector);
};

var FieldUtils = {
    error: function (request, error, errorStatus) {
        var body = new Buffer((error || new Error()).toString());
        var response = Response(errorStatus || "400", {
            "content-type": "text/plain;charset=utf-8",
            "content-length": body.length.toString(),
        }, body);
        return q.resolve([request, response]);
    },
};


var UnknownField = Object.freeze({
    access: function (request) {
        return FieldUtils.error(
            request, "Resource not found: " + request.uri, "404");
    },
});


var FieldManager = function FieldManager() {
    return Object.create(FieldManager.prototype, {
        factories: {value: {}},
        fields: {value: {}},
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
    var factory = this.factories[factoryId];
    if (!factory) return null;
    var fid = factoryId + (name ? name + "/" : "");
    var prefix = factory.prefix + (name ? name + "/" : "");
    var field = factory.ctor.apply(null, args);
    return this.bind(fid, prefix, field);
};
FieldManager.prototype.resolve = function (request) {
    var ids = Object.keys(this.fields);
    for (var i = 0; i < ids.length; i++) {
        var field = this.fields[ids[i]];
        var prefix = field.prefix;
        if (request.uri.substring(0, prefix.length) === prefix) {
            return field.field;
        }
    }
    return UnknownField;
};

var normalizeHeaders = function (headers) {
    return Object.keys(headers).reduce(function (o, key) {
        o[key.toLowerCase()] = headers[key];
        return o;
    }, {});
};

var ContentType = function ContentType(full) {
    full = full || "";
    // TBD: quated string value
    var list = full.split(";");
    var content = list[0].toLowerCase();
    var detail = content.split("/");
    var parameter = list.slice(1).reduce(function (params, param) {
        var kv = param.split("=");
        params[kv[0].trim().toLowerCase()] = kv[1].trim();
        return params;
    }, {});
    return Object.create(ContentType.prototype, {
        full: {value: full, enumerable: true},
        value: {value: content, enumerable: true},
        parameter: {value: Object.freeze(parameter), enumerable: true},
        type: {value: detail[0], enumerable: true},
        subtype: {value: detail[1], enumerable: true},
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
