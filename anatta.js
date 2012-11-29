exports.engine = {
    core: require("./engine/core"),
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
};
exports.termset = {
    core: require("./engine/termset/core"),
    builtin: require("./engine/termset/builtin"),
};
