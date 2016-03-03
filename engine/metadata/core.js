"use strict";

const url = require("url");
const termsetCore = require("../termset/core");
const metadataQuery = require("./query");

const states = new WeakMap();

// Metadata common value interface
const Metadata = class Metadata {
    // methods as REST
    get() {
        const engine = this.engine;
        const uri = this.href();
        const request = engine.space.request("GET", uri);
        return engine.space.access(request).then(a => Promise.all(a)).then(
            a => {
                const req = a[0], res = a[1];
                return engine.porter.entity(engine, req, res);
            });
    }
    put(message) {
        const engine = this.engine;
        const uri = this.href();
        const request = engine.space.request(
            "PUT", uri, message.headers, message.body);
        return engine.space.access(request).then(a => Promise.all(a)).then(
            a => {
                const req = a[0], res = a[1];
                return engine.porter.entity(engine, req, res);
            });
    }
    post(message) {
        const engine = this.engine;
        const uri = this.href();
        const request = engine.space.request(
            "POST", uri, message.headers, message.body);
        return engine.space.access(request).then(a => Promise.all(a)).then(
            a => {
                const req = a[0], res = a[1];
                return engine.porter.entity(engine, req, res);
            });
    }
    delete() {
        const engine = this.engine;
        const uri = this.href();
        const request = engine.space.request("DELETE", uri);
        return engine.space.access(request).then(a => Promise.all(a)).then(
            a => {
                const req = a[0], res = a[1];
                return engine.porter.entity(engine, req, res);
            });
    }
    // methods as metadata dict
    href() {
        const href = this.attr("href");
        if (!this.parent) return href;
        const parentUri = url.parse(this.parent.href());
        const uri = url.parse(href);
        return url.resolve(parentUri, uri);
    }
    attr(key) {
        // return as a string
        return "";
    }

    // methods as metadata list
    all() {
        // return as a list
        return [];
    }
    find(query) {
        return this.all().filter(metadataQuery.toQuery(query));
    };
    first(query) {
        const r = this.find(query);
        if (r.length < 1) return nilLink(this.engine);
        return r[0];
    }

    // selector of the content
    select(selector) {
        return [];
    }
};


// base of metadata as Request/Response
const Entity = class Entity extends Metadata {
    attr(key) {
        return this.glossary.entityAttr(this, key);
    }
    all() {
        const contentType = this.attr("content-type");
        const entries = this.glossary.entityLinkAll(this);
        return Array.from(entries, entry => this.engine.porter.link(
            this.engine, entry, contentType, this));
    }
};

// base of metadata as a hyperlink part in document
const Link = class Link extends Metadata {
    attr(key) {
        return this.parent.glossary.linkAttr(this, key);
    }
};

// nil Metadata
const NilEntity = class NilEntity extends Entity {
    static new(engine, request, response) {
        return Object.freeze(new NilEntity(engine, request, response));
    }
    constructor (engine, request, response) {
        super();
        const glossary = termsetCore.EntityGlossary("*", engine.glossary);
        states.set(this, {engine, glossary, request, response});
    }
    get engine() {return states.get(this).engine;}
    get glossary() {return states.get(this).glossary;}
    get request() {return states.get(this).request;}
    get response() {return states.get(this).response;}
};

const NilLink = class NilLink extends Link {
    static new(engine, none, parent) {
        return Object.freeze(new NilLink(engine, none, parent));
    }
    constructor (engine, none, parent) {
        super();
        states.set(this, {engine, parent});
    }
    get engine() {return states.get(this).engine;}
    get parent() {return states.get(this).parent;}
};

// nil instance
const nilEntity = function (engine) {
    // TBD: nil url
    const nilRequest = engine.space.request("GET", "");
    const nilResponse = engine.space.response("200", {
        "content-type": "application/octet-stream"});
    return NilEntity.new(engine, nilRequest, nilResponse);
};
const nilLink = function (engine) {
    return NilLink.new(engine, null, nilEntity(engine));
};

// Metadata factory
const PorterClass = class PorterClass {
    static new() {return Object.freeze(new PorterClass());}
    constructor () {states.set(this, {map: {}});}
    get map() {return states.get(this).map;}
    entity(engine, request, response) {
        const contentType = response.contentType();
        return this.resolve(contentType.value).Entity(
            engine, request, response);
    }
    link(engine, data, contentType, parent) {
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
    }
    resolve(contentType) {
        const self = states.get(this);
        const paramStart = contentType.indexOf(";");
        if (paramStart >= 0) {
            contentType = contentType.substring(0, paramStart).trim();
        }
        if (self.map[contentType]) return self.map[contentType];
        if (Porter.map[contentType]) return Porter.map[contentType];
        return Porter.nil;
    };  
};
const Porter = PorterClass.new;
Porter.map = {};
Porter.nil = {Entity: NilEntity.new, Link: NilLink.new};


exports.Metadata = Metadata;
exports.Link = Link;
exports.Entity = Entity;
exports.Porter = Porter;
