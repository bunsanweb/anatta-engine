var core = require("./core");

var Link = function JsonLink(engine, json, parent) {
    // TBD: json value copy
    return Object.create(JsonLink.prototype, {
        engine: {value: engine},
        json: {value: json},
        parent: {value: parent},
    });
};
Link.prototype = core.Link();
Link.prototype.attr = function (key) {
    var v = this.json[key]
    return v ? v.toString() : "";
};

var Entity = function JsonEntity(engine, request, response) {
    return Object.create(JsonEntity.prototype, {
        engine: {value: engine},
        request: {value: request},
        response: {value: response},
        json: {value: JSON.parse(response.body)},
    });
};
Entity.prototype = core.Entity();
Entity.prototype.attr = function (key) {
    var v = core.Entity.prototype.attr.call(this, key);
    if (v) return v;
    return Link.prototype.attr.call(this, key);
};
Entity.prototype.all = function () {
    if (typeof this.json !== "object") return [];
    return Object.keys(this.json).reduce((function (r, key) {
        var v = this.json[key];
        if (typeof v !== "object") return r;
        if (typeof v["href"] !== "string") return r;
        r.push(Link(this.engine, v, this));
        return r;
    }).bind(this), []);
};


exports.Link = Link;
exports.Entity = Entity;
