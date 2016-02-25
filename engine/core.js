"use strict";

const conftree = require("./conftree");
const space = {
    core: require("./space/core")
};
const metadata = {
    core: require("./metadata/core")
};
const termset = {
    core: require("./termset/core"),
    builtin: require("./termset/builtin")
};

const Engine = function Engine(opts) {
    opts = conftree.create(opts, {space: {}, medatata: {}});
    const glossary = termset.core.EngineGlossary();
    glossary.add(termset.builtin.termset);
    return Object.create(Engine.prototype, {
        opts: {value: opts, enumerable: true},
        space: {value: space.core.Space(opts.space)},
        porter: {value: metadata.core.Porter(opts.metadata)},
        glossary: {value: glossary},
    });
};
Engine.prototype.link = function (data, contentType, parent) {
    contentType = contentType || "application/json";
    return this.porter.link(this, data, contentType, parent);
};

exports.Engine = Engine;
