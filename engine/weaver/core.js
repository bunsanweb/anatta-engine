"use strict";

const window = require("./window");
const conftree = require("../conftree");

const states = new WeakMap();
const Agent = class Agent {
    static new(opts) {return Object.freeze(new Agent(opts));}
    constructor(opts) {
        opts = conftree.create(opts, {uri: ""});
        states.set(this, {opts, entity: null, engine: null, window: null});
    }
    get opts() {return states.get(this).opts;}
    get entity() {return states.get(this).entity;}
    set entity(e) {states.get(this).entity = e;}
    get engine() {return states.get(this).engine;}
    set engine(e) {states.get(this).engine = e;}
    get window() {return states.get(this).window;}
    set window(w) {states.get(this).window = w;}
    activate() {
        if (this.entity) return Promise.resolve(this);
        const link = this.engine.link({href: this.opts.uri});
        return link.get().then(entity => {
            if (this.entity) return this;
            this.entity = entity;
            return window.init(this);
        });
    }
    access(request) {return window.access(this, request);}
};

const AgentField = class AgentField {
    static new(opts) {return new AgentField(opts);}
    constructor(opts) {states.set(this, {opts, agent: Agent.new(opts)});}
    get opts() {return states.get(this).opts;}
    get agent() {return states.get(this).agent;}
    access(request) {
        return this.agent.activate().then(agent => agent.access(request));
    }
};

exports.Agent = Agent.new;
exports.AgentField = AgentField.new;
