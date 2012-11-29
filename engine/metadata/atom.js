var core = require("./core");
var jsdom = require("./jsdom");
var termset = {
    core: require("../termset/core"),
};

var Entity = function AtomEntity(engine, request, response) {
    var atom = jsdom.createDocument();
    atom.innerHTML = response.body.toString();
    return Object.create(AtomEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "application/atom+xml", engine.glossary)},
        request: {value: request},
        response: {value: response},
        atom: {value: atom},
    });
};
Entity.prototype = core.Entity();

var Link = function AtomLink(engine, atom, parent) {
    return Object.create(AtomLink.prototype, {
        engine: {value: engine},
        atom: {value: atom},
        parent: {value: parent},
    });
};
Link.prototype = core.Link();


exports.Link = Link;
exports.Entity = Entity;
