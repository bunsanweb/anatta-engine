var core = require("./core");
var jsdom = require("./jsdom");
var termset = {
    core: require("../termset/core"),
};


var Entity = function HtmlEntity(engine, request, response) {
    var html = jsdom.createHTMLDocument();
    html.innerHTML = response.body.toString();
    return Object.create(HtmlEntity.prototype, {
        engine: {value: engine},
        glossary: {value: termset.core.EntityGlossary(
            "text/html", engine.glossary)},
        request: {value: request},
        response: {value: response},
        html: {value: html},
    });
};
Entity.prototype = core.Entity();

var Link = function HtmlLink(engine, html, parent) {
    return Object.create(HtmlLink.prototype, {
        engine: {value: engine},
        html: {value: html},
        parent: {value: parent},
    });
};
Link.prototype = core.Link();


exports.Link = Link;
exports.Entity = Entity;

