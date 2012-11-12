var space = {
    core: require("./space/core"),
};
var metadata = {
    core: require("./metadata/core"),
};

var Engine = function Engine(opts) {
    opts = opts || {};
    opts.space = opts.space || {};
    opts.metadata = opts.metadata || {};
    return Object.create(Engine.prototype, {
        opts: {value: opts, enumerable: true},
        space: {value: space.core.Space(opts.space)},
        porter: {value: metadata.core.Porter(opts.metadata)},
    });
};
Engine.prototype.link = function (data, contentType) {
    contentType = contentType || "application/json";
    return this.porter.link(this, data, contentType);
};

exports.Engine = Engine;
