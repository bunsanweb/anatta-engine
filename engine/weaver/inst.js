"use strict";

var q = require("q");
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
var createGalaxy = function (inst) {
    var d = q.defer();
    inst = insertSrcField(inst);
    d.resolve([galaxy.core.GalaxyField(inst), builder.engine(inst.engine)]);
    return d.promise;
};
var activate = function (engine, inst) {
    var prefix = url.resolve(inst.root, inst.id);
    inst.from = prefix;
    return createGalaxy(inst).spread(function (field, subEngine) {
        field.engine = subEngine;
        engine.space.manager.bind("galaxy|" + prefix, prefix, field);
        return engine.link({href: prefix + "/manifest.html"}).get();
    });
};

exports.activate = activate;
