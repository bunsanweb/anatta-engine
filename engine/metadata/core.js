var url = require("url");
var q = require("q");

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

// methods as metadata dict
Metadata.prototype.href = function () {
    var href = this.attr("href");
    return this.parent ? url.resolve(this.parent.href(), href) : href;
};
Metadata.prototype.attr = function (key) {
    // return as a string
    return "";
};

// methods as metadata list
Metadata.prototype.all = function () {
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


// base of metadata as Request/Response
var Entity = function Entity() {
    return Object.create(Entity.prototype, {});
};
Entity.prototype = Metadata();
Entity.prototype.attr = function (key) {
    if (key === "href") return this.request.uri;
    var headerKeys = Object.keys(this.request.headers);
    if (headerKeys[key]) return headerKeys[key];
    return "";
};


// base of metadata as a hyperlink part in document
var Link = function Link() {
    return Object.create(Link.prototype, {});
};
Link.prototype = Metadata();


// nil Metadata
var NilEntity = function NilEntity(engine, request, response) {
    return Object.create(NilEntity.prototype, {
        engine: {value: engine},
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
    var contentType = response.headers["content-type"];
    return this.resolve(contentType).Entity(engine, request, response);
};
Porter.prototype.link = function (engine, data, contentType) {
    return this.resolve(contentType).Link(engine, data);
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
