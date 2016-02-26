"use strict";

const core = require("./core");
const conftree = require("../conftree");

const DataField = function DataField(opts) {
    return Object.create(DataField.prototype, {
        opts: {value: conftree.create(opts, {})}
    });
};
const uric = "[^/;?:@&=+,]";
const dsPattern = new RegExp(
    `^data:(${uric}+/${uric}+(?:;${uric}+=${uric}+)*)?(;base64)?,(.*)${"$"}`);
DataField.prototype.access = function (request) {
    if (request.method !== "GET") {
        return Promise.all([request, core.Response("405", {allow: "GET"})]);
    }
    const data = dsPattern.exec(request.href);
    if (!data) {
        return core.FieldUtil.error(request, "Invalid Data Scheme URI", "404");
    }
    const body = new Buffer(decodeURI(data[3]), data[2] ? "base64" : "utf-8");
    const response = core.Response("200", {
        "content-type": data[1] ? data[1] : "text/plain;charset=utf-8",
        "content-length": body.length.toString()
    }, body);
    return Promise.all([request, response]);
};

exports.DataField = DataField;
