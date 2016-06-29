"use strict";

// map a object to the default config json object tree values

// copy-on-write property object tree
// - at first getter returns the value of the defaults
// - setter overwrite its getter/setter to a new value
const ConfTree = function ConfTree(json, parent, name) {
    const conf = Object.create(ConfTree.prototype);
    const descs = Object.keys(json).reduce((descs, key) => {
        const desc = Reflect.getOwnPropertyDescriptor(json, key);
        const value = Array.isArray(desc.value) ? desc.value.concat() :
                  typeof desc.value === "object" ?
                  ConfTree(desc.value, conf, key) : desc.value;
        desc.enumerable = false;
        Reflect.deleteProperty(desc, "value");
        Reflect.deleteProperty(desc, "writable");
        desc.get = function get() {
            return value;
        };
        desc.set = function set(v) {
            Reflect.defineProperty(this, key, {
                value: v, enumerable: true, writable: true});
            if (parent) parent[name] = this;
        };
        descs[key] = desc;
        return descs;
    }, {});
    Object.defineProperties(conf, descs);
    return conf;
};

// bind copy-on-write properties to the custom object
const bind = function bind(custom, conf) {
    Object.keys(custom).forEach(key => {
        const value = custom[key];
        if (typeof value === "object" && !Array.isArray(value) && conf[key]) {
            bind(value, conf[key]);
        } else {
            conf[key] = value;
        }
    });
    return conf;
};


const create = function create(custom, defaults) {
    return bind(custom || {},
                defaults instanceof ConfTree ? defaults : ConfTree(defaults));
};

exports.create = create;
