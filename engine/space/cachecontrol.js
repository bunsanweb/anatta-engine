"use strict";

const core = require("./core");

exports.NotModified = core.Response("304", {}, "");

const parseCacheControl = (cachecontrol) => {
    if (!cachecontrol) return {};
    const cc = {};
    cachecontrol.split(/;/).forEach(elem => {
        const kv = elem.split(/[=]/);
        cc[kv[0].trim().toLowerCase()] = kv[1] ? kv[1].trim() : true;
    });
    return cc;
};

function clientCacheValid(request, timestamp) {
    const cc = parseCacheControl(request.headers["cacne-control"]);
    const since = request.headers["if-modified-since"];
    if (cc["no-cache"] || cc["no-store"] || !since) return false;
    const sinceDate = new Date(since);
    // drop msec from timestamp
    const ts = new Date(timestamp.getTime());
    ts.setMilliseconds(0);
    if (ts <= sinceDate) return true;
    return false;
}

exports.clientCacheValid = clientCacheValid;
