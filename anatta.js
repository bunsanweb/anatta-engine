exports.engine = {
    core: require("./engine/core"),
};
exports.space = {
    core: require("./engine/space/core"),
    data: require("./engine/space/data"),
    file: require("./engine/space/file"),
};
exports.metadata = {
    core: require("./engine/metadata/core"),
    json: require("./engine/metadata/json"),
    atom: require("./engine/metadata/atom"),
};
