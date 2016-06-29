"use strict";

const core = require("./core");
const conftree = require("../conftree");

// data URL scheme see: https://www.ietf.org/rfc/rfc2397.txt
const uric = "[^/;?:@&=+,]";
const dsPattern = new RegExp(
    `^data:(${uric}+/${uric}+(?:;${uric}+=${uric}+)*)?(;base64)?,(.*)${"$"}`);

const states = new WeakMap();
const DataField = class DataField {
    static new(opts) {return Object.freeze(new DataField(opts));}
    constructor(opts) {
        opts = conftree.create(opts, {});
        states.set(this, {opts});
    }
    access(request) {
        if (request.method !== "GET") {
            const notAllowed = core.Response("405", {allow: "GET"});
            return Promise.all([request, notAllowed]);
        }
        const data = dsPattern.exec(request.href);
        if (!data) {
            return core.FieldUtil.error(
                request, "Invalid Data Scheme URI", "404");
        }
        const body = Buffer.from(
            decodeURI(data[3]), data[2] ? "base64" : "utf-8");
        const response = core.Response("200", {
            "content-type": data[1] ? data[1] : "text/plain;charset=utf-8",
            "content-length": body.length.toString()
        }, body);
        return Promise.all([request, response]);
    }
};

exports.DataField = DataField.new;
