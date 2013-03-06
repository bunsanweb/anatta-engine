"use strict";

var url = require("url");
var builder = require("../builder");
var galaxy = {
    core: require("../galaxy/core"),
};
var insertSrcField = function (inst) {
    var prefix = "inst+src:";
    inst.engine.space[prefix] = {
        field: "galaxy",
        from: prefix,
        to: inst.src
    };
    return inst;
};
var activate = function (engine, inst) {
    inst = insertSrcField(inst);
    var prefix = url.resolve(inst.root, inst.id);
    inst.from = prefix;
    inst.manifest = inst.from + "/manifest.html";
    var field = galaxy.core.GalaxyField(inst);
    field.engine = builder.engine(inst.engine);
    engine.space.manager.bind("galaxt|"+prefix, prefix, field);
    return inst;
};

exports.activate = activate;
