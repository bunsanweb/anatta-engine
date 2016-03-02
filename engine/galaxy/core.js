"use strict";

const conftree = require("../conftree");
const spaceCore = require("../space/core");

const states = new WeakMap();
const GalaxyField = class GalaxyField {
    static new(opts) {return Object.freeze(new GalaxyField(opts));}
    constructor (opts) {
        opts = conftree.create(opts, {to: "module:/", from: "/"});
        states.set(this, {engine: null, opts});
    }
    get engine() {return states.get(this).engine;}
    set engine(e) {states.get(this).engine = e;}
    get opts() {return states.get(this).opts;}
    access(request) {
        if (!this.engine || request.href.indexOf(this.opts.from) !== 0) {
            return spaceCore.FieldUtils.error(
                request, Error("invalid settings"), "404");
        }
        const uripart = request.href.substring(this.opts.from.length);
        const uri = `${this.opts.to}${uripart}`;
        
        const req = this.engine.space.request(
            request.method, uri, request.headers, request.body, request);
        return this.engine.space.access(req).then(a => Promise.all(a)).then(
            reqres => [request, reqres[1]]);
    }
};

exports.GalaxyField = GalaxyField.new;
