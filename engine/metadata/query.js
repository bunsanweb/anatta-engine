
var jsonToQuery = function (json) {
    var names = Object.keys(json);
    return function (link) {
        return names.every(function (name) {
            var attr = link.attr(name);
            var value = json[name];
            if (value === false || value == null) return !attr;
            if (value === true) return !!attr;
            if (typeof value === "number") return attr == value;
            if (typeof value === "string") return attr === value;
            if (Array.isArray(value)) {
                var attrs = attr.split(/\s+/);
                return value.every(function (v) {
                    return attrs.indexOf(v) >= 0;
                });
            }
            return false;
        });
    };
};

var anyQuery = function (link) {return true;};
var emptyQuery = function (link) {return false;};

var toQuery = function (selector) {
    if (selector && (selector instanceof Object)) return jsonToQuery(selector);
    if (typeof selector === "function") return selector;
    if (selector === "*") return anyQuery;
    return emptyQuery;
};

exports.toQuery = toQuery;
