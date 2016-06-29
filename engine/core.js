"use strict";

const conftree = require("./conftree");
const spaceCore = require("./space/core");
const metadataCore = require("./metadata/core");
const termsetCore = require("./termset/core");
const termsetBuiltin = require("./termset/builtin");

const states = new WeakMap();

const Engine = class Engine {
    static new(opts) {return Object.freeze(new Engine(opts));}
    constructor(opts) {
        opts = conftree.create(opts, {space: {}, medatata: {}});
        const glossary = termsetCore.EngineGlossary();
        glossary.add(termsetBuiltin.termset);
        const space = spaceCore.Space(opts.space);
        const porter = metadataCore.Porter(opts.metadata);
        states.set(this, {space, porter, glossary, opts});
    }
    get opts() {return states.get(this).opts;}
    get space() {return states.get(this).space;}
    get porter() {return states.get(this).porter;}
    get glossary() {return states.get(this).glossary;}
    link(data, contentType, parent) {
        contentType = contentType || "application/json";
        return states.get(this).porter.link(this, data, contentType, parent);
    }
};
exports.Engine = Engine.new;
