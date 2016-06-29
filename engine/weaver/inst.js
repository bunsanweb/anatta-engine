"use strict";

const url = require("url");
const builder = require("../builder");
const galaxy = {
    core: require("../galaxy/core")
};
const insertSrcField = (inst) => {
    const prefix = "inst+src:";
    inst.engine.space[prefix] = {
        field: "galaxy",
        from: prefix,
        to: inst.src
    };
};

function activate(engine, inst) {
    const prefix = url.resolve(inst.root, inst.id);
    return new Promise((f, r) => {
        inst.from = prefix;
        insertSrcField(inst);
        const field = galaxy.core.GalaxyField(inst);
        const subEngine = builder.engine(inst.engine);
        field.engine = subEngine;
        engine.space.manager.bind(`galaxy|${prefix}`, prefix, field);
        f(engine);
    }).then(engine => engine.link({href: `${prefix}/manifest.html`}).get());
}

exports.activate = activate;
