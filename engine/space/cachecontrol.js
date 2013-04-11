"use strict";

var core = require("./core");

exports.NotModified = core.Response("304", {}, "");

var clientCacheValid = function (request, timestamp) {
    var cc = parseCacheControl(request.headers["cacne-control"]);
    var since = request.headers["if-modified-since"];
    if (cc["no-cache"] || cc["no-store"] || !since) return false;
    var sinceDate = new Date(since);
    // drop msec from timestamp
    var ts = new Date(timestamp.getTime());
    ts.setMilliseconds(0);
    if (ts <= sinceDate) return true;
    return false;
};
var parseCacheControl = function (cachecontrol) {
    if (!cachecontrol) return {};
    var cc = {};
    cachecontrol.split(/;/).forEach(function (elem) {
        var kv = elem.split(/=/);
        cc[kv[0].trim().toLowerCase()] = kv[1] ? kv[1].trim() : true;
    });
    return cc;
};


exports.clientCacheValid = clientCacheValid;
