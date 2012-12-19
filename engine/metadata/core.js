"use strict";

var url = require("url");
var q = require("q");
var termset = {
    core: require("../termset/core"),
};

// Metadata common value interface
var Metadata = function Metadata() {
    return Object.create(Metadata.prototype, {});
};
// methods as REST
Metadata.prototype.get = function () {
    var engine = this.engine;
    var uri = this.href();
    var request = engine.space.request("GET", uri);
    return engine.space.access(request).spread(function (req, res) {
        return engine.porter.entity(engine, req, res);
    });
};
Metadata.prototype.put = function (message) {
    var engine = this.engine;
    var uri = this.href();
    var request = engine.space.request(
        "PUT", uri, message.headers, message.body);
    return engine.space.access(request).spread(function (req, res) {
        return engine.porter.entity(engine, req, res);
    });
};
Metadata.prototype.post = function (message) {
    var engine = this.engine;
    var uri = this.href();
    var request = engine.space.request(
        "POST", uri, message.headers, message.body);
    return engine.space.access(request).spread(function (req, res) {
        return engine.porter.entity(engine, req, res);
    });
};
Metadata.prototype.delete = function () {
    var engine = this.engine;
    var uri = this.href();
    var request = engine.space.request("DELETE", uri);
    return engine.space.access(request).spread(function (req, res) {
        return engine.porter.entity(engine, req, res);
    });
};


// methods as metadata dict
Metadata.prototype.href = function () {
    var href = this.attr("href");
    if (!this.parent) return href;
    var parentUri = url.parse(this.parent.href());
    var uri = url.parse(href);
    if (uri.protocol && parentUri.protocol !== uri.protocol) {
        return href; // avoid nodejs bug
    }
    return url.resolve(parentUri, uri);
};
Metadata.prototype.attr = function (key) {
    // return as a string
    return "";
};

// methods as metadata list
Metadata.prototype.all = function () {
    // TBD:
    return [];
};
Metadata.prototype.find = function (query) {
    // TBD: query language
    // query as function
    return this.all().filter(query);
};
Metadata.prototype.first = function (query) {
    var r = this.find(query);
    if (r.length < 1) return NilLink(this.engine);
    return r[0];
};

// selector of the content
Metadata.prototype.select = function (selector) {
    return [];
};

// base of metadata as Request/Response
var Entity = function Entity() {
    return Object.create(Entity.prototype, {});
};
Entity.prototype = Metadata();
Entity.prototype.attr = function (key) {
    return this.glossary.entityAttr(this, key);
};
Entity.prototype.all = function () {
    var contentType = this.attr("content-type");
    var entries = this.glossary.entityLinkAll(this);
    return entries.map(function (entry) {
        return this.engine.porter.link(this.engine, entry, contentType, this);
    }, this);
};


// base of metadata as a hyperlink part in document
var Link = function Link() {
    return Object.create(Link.prototype, {});
};
Link.prototype = Metadata();
Link.prototype.attr = function (key) {
    return this.parent.glossary.linkAttr(this, key);
};

// nil Metadata
var NilEntity = function NilEntity(engine, request, response) {
    return Object.create(NilEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "*", engine.glossary)},
        request: {value: request},
        response: {value: response},
    });
};
NilEntity.prototype = Entity();

var NilLink = function NilLink(engine) {
    return Object.create(NilLink.prototype, {
        engine: {value: engine},
    });
};
NilLink.prototype = Link();

// Metadata factory
var Porter = function Porter() {
    return Object.create(Porter.prototype, {
        map: {value: {}},
    });
};
Porter.map = {};
Porter.nil = {Entity: NilEntity, Link: NilLink};
Porter.prototype.entity = function (engine, request, response) {
    var contentType = response.contentType();
    return this.resolve(contentType.value).Entity(engine, request, response);
};
Porter.prototype.link = function (engine, data, contentType, parent) {
    if (!parent) {
        contentType = contentType.valueOf();
        var body = JSON.stringify(data);
        var uri = "data:" + contentType + "," + body;
        var request = engine.space.request("GET", uri);
        var response = engine.space.response(
            "200", {"content-type": contentType}, body);
        parent = this.entity(engine, request, response);
    }
    return this.resolve(contentType).Link(engine, data, parent);
};
Porter.prototype.resolve = function (contentType) {
    var paramStart = contentType.indexOf(";");
    if (paramStart >= 0) {
        contentType = contentType.substring(0, paramStart).trim();
    }
    if (this.map[contentType]) return this.map[contentType];
    if (Porter.map[contentType]) return Porter.map[contentType];
    return Porter.nil;
};


exports.Metadata = Metadata;
exports.Link = Link;
exports.Entity = Entity;
exports.Porter = Porter;
