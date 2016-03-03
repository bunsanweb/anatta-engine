"use strict";

const core = require("./core");
const termsetCore = require("../termset/core");

const states = new WeakMap();
const select = (json, selector) => {
    const value = json[selector];
    if (value === undefined) return [];
    if (Array.isArray(value)) return value;
    return [value];
};

const JsonEntity = class JsonEntity extends core.Entity {
    static new(engine, request, response) {
        return Object.freeze(new JsonEntity(engine, request, response));
    }
    constructor (engine, request, response) {
        super();
        const json = JSON.parse(response.body);
        const glossary = termsetCore.EntityGlossary(
            "application/json", engine.glossary);
        states.set(this, {engine, glossary, request, response, json});
    }
    get engine() {return states.get(this).engine;}
    get glossary() {return states.get(this).glossary;}
    get request() {return states.get(this).request;}
    get response() {return states.get(this).response;}
    get json() {return states.get(this).json;}
    select(selector) {return select(this.json, selector);}
};

const JsonLink = class JsonLink extends core.Link {
    static new(engine, json, parent) {
        return Object.freeze(new JsonLink(engine, json, parent));
    }
    constructor (engine, json, parent) {
        super();
        states.set(this, {engine, json, parent});
    }
    get engine() {return states.get(this).engine;}
    get json() {return states.get(this).json;}
    get parent() {return states.get(this).parent;}
    select(selector) {return select(this.json, selector);}
};

exports.Link = JsonLink.new;
exports.Entity = JsonEntity.new;
