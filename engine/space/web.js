"use strict";

const url = require("url");
const protocols = {
    "http:": require("http"),
    "https:": require("https")
};
const core = require("./core");
const conftree = require("../conftree");


const readFull = (rs) => new Promise((f, r) => {
    const chunks = [];
    rs.on("data", chunk => chunks.push(chunk));
    rs.on("end", () => f(Buffer.concat(chunks)));
    rs.on("error", err => r(err));
});

const states = new WeakMap();
const WebField = class WebField {
    static new(opts) {return Object.freeze(new WebField(opts));}
    constructor(opts) {
        opts = conftree.create(opts, {rejectUnauthorized: false});
        states.set(this, {opts});
    }
    access(request) {
        return new Promise((f, r) => {
            const opts = url.parse(request.href);
            opts.method = request.method;
            opts.headers = request.headers;
            opts.rejectUnauthorized = states.get(this).opts.rejectUnauthorized;
            protocols[opts.protocol].request(opts, res => {
                readFull(res).then(body => {
                    const response = core.Response(
                        res.statusCode, res.headers, body);
                    f([request, response]);
                }, err => f(core.FieldUtils.error(request, err, "400")));
            }).end(request.body);
        });
    }
};

exports.WebField = WebField.new;
