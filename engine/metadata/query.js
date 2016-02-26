
const jsonToQuery = (json) => (link) => Object.keys(json).every(name => {
    const attr = link.attr(name);
    const value = json[name];
    if (value === false || value == null) return !attr;
    if (value === true) return !!attr;
    if (typeof value === "number") return attr == value;
    if (typeof value === "string") return attr === value;
    if (Array.isArray(value)) {
        const attrs = attr.split(/\s+/);
        return value.every(v => attrs.indexOf(v) >= 0);
    }
    return false;
});

const anyQuery = (link) => true;
const emptyQuery = (link) => false;

const toQuery = function (selector) {
    if (selector === null || selector === undefined) return emptyQuery;
    if (typeof selector === "object") return jsonToQuery(selector);
    if (typeof selector === "function") return selector;
    if (selector === "*") return anyQuery;
    return emptyQuery;
};

exports.toQuery = toQuery;
