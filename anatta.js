"use strict";

exports.engine = {
    core: require("./engine/core"),
    builder: require("./engine/builder"),
    conftree: require("./engine/conftree"),
};
exports.space = {
    core: require("./engine/space/core"),
    data: require("./engine/space/data"),
    file: require("./engine/space/file"),
    web: require("./engine/space/web"),
};
exports.metadata = {
    core: require("./engine/metadata/core"),
    json: require("./engine/metadata/json"),
    atom: require("./engine/metadata/atom"),
    html: require("./engine/metadata/html"),
    multipart: require("./engine/metadata/multipart"),
};
exports.termset = {
    core: require("./engine/termset/core"),
    builtin: require("./engine/termset/builtin"),
    desc: require("./engine/termset/desc"),
};
exports.weaver = {
    core: require("./engine/weaver/core"),
};
exports.webgate = {
    core: require("./engine/webgate/core"),
};
exports.orb = {
    core: require("./engine/orb/core"),
    memory: require("./engine/orb/memory"),
    dir: require("./engine/orb/dir"),
};
exports.galaxy = {
    core: require("./engine/galaxy/core"),
};
exports.shared = function (relpath) {
    relpath = relpath || "/";
    var path = require("path");
    return path.resolve(path.dirname(module.filename),
                        path.join("shared", relpath));
};
