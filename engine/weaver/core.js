"use strict";

var q = require("q");
var window = require("./window");
var conftree = require("../conftree");

var Agent = function Agent(opts) {
    return Object.create(Agent.prototype, {
        opts: {value: conftree.create(opts, {uri: "", })},
        window: {value: window.Window()},
        entity: {value: null, writable: true},
        engine: {value: null, writable: true},
    });
};
Agent.prototype.activate = function () {
    if (this.entity) {
        var d = q.defer();
        d.resolve(this);
        return d.promise;
    }
    var self = this;
    var link = this.engine.link({href: this.opts.uri});
    return link.get().then(function (entity) {
        if (self.entity) return self;
        self.entity = entity;
        return window.init(self);
    });
};
Agent.prototype.access = function (request) {
    return window.access(this, request);
};


var AgentField = function AgentField(opts) {
    return Object.create(AgentField.prototype, {
        opts: {value: opts},
        agent: {value: Agent(opts)},
    });
};
AgentField.prototype.access = function (request) {
    return this.agent.activate().then(function (agent) {
        return agent.access(request);
    });
};


exports.Agent = Agent;
exports.AgentField = AgentField;
