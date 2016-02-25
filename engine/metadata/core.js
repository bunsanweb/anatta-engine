"use strict";

const url = require("url");
const termset = {
    core: require("../termset/core"),
};
const metadata = {
    query: require("./query"),
};

// Metadata common value interface
const Metadata = function Metadata() {
    return Object.create(Metadata.prototype, {});
};
// methods as REST
Metadata.prototype.get = function () {
    const engine = this.engine;
    const uri = this.href();
    const request = engine.space.request("GET", uri);
    return engine.space.access(request).then(a => Promise.all(a)).then(a => {
        const req = a[0], res = a[1];
        return engine.porter.entity(engine, req, res);
    });
};
Metadata.prototype.put = function (message) {
    const engine = this.engine;
    const uri = this.href();
    const request = engine.space.request(
        "PUT", uri, message.headers, message.body);
    return engine.space.access(request).then(a => Promise.all(a)).then(a => {
        const req = a[0], res = a[1];
        return engine.porter.entity(engine, req, res);
    });
};
Metadata.prototype.post = function (message) {
    const engine = this.engine;
    const uri = this.href();
    const request = engine.space.request(
        "POST", uri, message.headers, message.body);
    return engine.space.access(request).then(a => Promise.all(a)).then(a => {
        const req = a[0], res = a[1];
        return engine.porter.entity(engine, req, res);
    });
};
Metadata.prototype.delete = function () {
    const engine = this.engine;
    const uri = this.href();
    const request = engine.space.request("DELETE", uri);
    return engine.space.access(request).then(a => Promise.all(a)).then(a => {
        const req = a[0], res = a[1];
        return engine.porter.entity(engine, req, res);
    });
};


// methods as metadata dict
Metadata.prototype.href = function () {
    const href = this.attr("href");
    if (!this.parent) return href;
    const parentUri = url.parse(this.parent.href());
    const uri = url.parse(href);
    return url.resolve(parentUri, uri);
};
Metadata.prototype.attr = function (key) {
    // return as a string
    return "";
};

// methods as metadata list
Metadata.prototype.all = function () {
    // return as a list
    return [];
};
Metadata.prototype.find = function (query) {
    return this.all().filter(metadata.query.toQuery(query));
};
Metadata.prototype.first = function (query) {
    const r = this.find(query);
    if (r.length < 1) return nilLink(this.engine);
    return r[0];
};

// selector of the content
Metadata.prototype.select = function (selector) {
    return [];
};


// base of metadata as Request/Response
const Entity = function Entity() {
    return Object.create(Entity.prototype, {});
};
Entity.prototype = Metadata();
Entity.prototype.attr = function (key) {
    return this.glossary.entityAttr(this, key);
};
Entity.prototype.all = function () {
    const contentType = this.attr("content-type");
    const entries = this.glossary.entityLinkAll(this);
    return Array.from(entries, entry => this.engine.porter.link(
        this.engine, entry, contentType, this));
};


// base of metadata as a hyperlink part in document
const Link = function Link() {
    return Object.create(Link.prototype, {});
};
Link.prototype = Metadata();
Link.prototype.attr = function (key) {
    return this.parent.glossary.linkAttr(this, key);
};

// nil Metadata
const NilEntity = function NilEntity(engine, request, response) {
    return Object.create(NilEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "*", engine.glossary)},
        request: {value: request},
        response: {value: response}
    });
};
NilEntity.prototype = Entity();

const NilLink = function NilLink(engine, none, parent) {
    return Object.create(NilLink.prototype, {
        engine: {value: engine},
        parent: {value: parent}
    });
};
NilLink.prototype = Link();

// nil instance
const nilEntity = function (engine) {
    // TBD: nil url
    const nilRequest = engine.space.request("GET", "");
    const nilResponse = engine.space.response("200", {
        "content-type": "application/octet-stream"});
    return NilEntity(engine, nilRequest, nilResponse);
};
const nilLink = function (engine) {
    return NilLink(engine, null, nilEntity(engine));
};

// Metadata factory
const Porter = function Porter() {
    return Object.create(Porter.prototype, {
        map: {value: {}}
    });
};
Porter.map = {};
Porter.nil = {Entity: NilEntity, Link: NilLink};
Porter.prototype.entity = function (engine, request, response) {
    const contentType = response.contentType();
    return this.resolve(contentType.value).Entity(engine, request, response);
};
Porter.prototype.link = function (engine, data, contentType, parent) {
    if (!parent) {
        contentType = contentType.valueOf();
        const body = JSON.stringify(data);
        const uri = `data:${contentType},${body}`;
        const request = engine.space.request("GET", uri);
        const response = engine.space.response(
            "200", {"content-type": contentType}, body);
        parent = this.entity(engine, request, response);
    }
    return this.resolve(contentType).Link(engine, data, parent);
};
Porter.prototype.resolve = function (contentType) {
    const paramStart = contentType.indexOf(";");
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
