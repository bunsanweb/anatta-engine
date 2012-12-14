"use strict";

var core = require("./core");
var termset = {
    core: require("../termset/core"),
};

var Entity = function JsonEntity(engine, request, response) {
    return Object.create(JsonEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "application/json", engine.glossary)},
        request: {value: request},
        response: {value: response},
        json: {value: JSON.parse(response.body)},
    });
};
Entity.prototype = core.Entity();

var Link = function JsonLink(engine, json, parent) {
    return Object.create(JsonLink.prototype, {
        engine: {value: engine},
        json: {value: json},
        parent: {value: parent},
    });
};
Link.prototype = core.Link();

exports.Link = Link;
exports.Entity = Entity;
