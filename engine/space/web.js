"use strict";

const url = require("url");
const protocols = {
    "http:": require("http"),
    "https:": require("https")
};
const core = require("./core");
const conftree = require("../conftree");

const WebField = function WebField(opts) {
    return Object.create(WebField.prototype, {
        opts: {value: conftree.create(opts, {rejectUnauthorized: false})}
    });
};

WebField.prototype.access = function (request) {
    return new Promise((f, r) => {
        const opts = url.parse(request.href);
        opts.method = request.method;
        opts.headers = request.headers;
        opts.rejectUnauthorized = this.opts.rejectUnauthorized;
        const req = protocols[opts.protocol].request(opts, res => {
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => {
                const body = Buffer.concat(chunks);
                const response = core.Response(
                    res.statusCode, res.headers, body);
                f([request, response]);
            });
        });
        req.on("error", err => f(core.FieldUtils.error(request, err, "400")));
        req.end(request.body);
    });
};

exports.WebField = WebField;
