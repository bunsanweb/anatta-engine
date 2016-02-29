"use strict";

const window = require("./window");
const conftree = require("../conftree");

const Agent = function Agent(opts) {
    return Object.create(Agent.prototype, {
        opts: {value: conftree.create(opts, {uri: ""})},
        entity: {value: null, writable: true},
        engine: {value: null, writable: true}
    });
};
Agent.prototype.activate = function () {
    if (this.entity) return Promise.resolve(this);
    const link = this.engine.link({href: this.opts.uri});
    return link.get().then(entity => {
        if (this.entity) return this;
        this.entity = entity;
        return window.init(this);
    });
};
Agent.prototype.access = function (request) {
    return window.access(this, request);
};


const AgentField = function AgentField(opts) {
    return Object.create(AgentField.prototype, {
        opts: {value: opts},
        agent: {value: Agent(opts)}
    });
};
AgentField.prototype.access = function (request) {
    return this.agent.activate().then(agent => agent.access(request));
};


exports.Agent = Agent;
exports.AgentField = AgentField;
