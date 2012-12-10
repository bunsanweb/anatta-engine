var space = {
    core: require("./space/core"),
};
var metadata = {
    core: require("./metadata/core"),
};
var termset = {
    core: require("./termset/core"),
    builtin: require("./termset/builtin"),
};

var Engine = function Engine(opts) {
    opts = opts || {};
    opts.space = opts.space || {};
    opts.metadata = opts.metadata || {};
    var glossary = termset.core.EngineGlossary();
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
