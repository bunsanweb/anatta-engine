"use strict";

var ConfTree = function ConfTree(json, parent, name) {
    var conf = Object.create(ConfTree.prototype);
    var descs = Object.keys(json).reduce(function (descs, key) {
        var desc = Object.getOwnPropertyDescriptor(json, key);
        var value = desc.value;
        var called = false;
        if (Array.isArray(value)) {
            value = value.concat();
        } else if (typeof value === "object") {
            value = ConfTree(value, conf, key);
        }
        desc.enumerable = false;
        delete desc.value;
        delete desc.writable;
        desc.get = function () {
            return value;
        }
        desc.set = function (v) {
            Object.defineProperty(this, key, {
                value: v, enumerable: true, writable: true});
            if (parent) parent[name] = this;
        };
        descs[key] = desc;
        return descs;
    }, {});
    Object.defineProperties(conf, descs);
    return conf;
};

var bind = function bind(custom, conf) {
    Object.keys(custom).forEach(function (key) {
        var value = custom[key];
        if (typeof value === "object" && !Array.isArray(value) && conf[key]) {
            bind(value, conf[key]);
        } else {
            conf[key] = value;
        }
    });
    return conf;
};


var create = function create(custom, defaults) {
    return bind(custom || {},
                defaults instanceof ConfTree ? defaults : ConfTree(defaults));
};

exports.create = create;
