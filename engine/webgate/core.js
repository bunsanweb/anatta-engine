"use strict";

const protocols = {
    http: require("http"),
    https: require("https")
};
const url = require("url");
const path = require("path");
const conftree = require("../conftree");

const WebGate = function WebGate(space, opts) {
    opts = conftree.create(opts,  {from: "/", to: "me:/"});
    return Object.create(WebGate.prototype, {
        space: {value: space},
        opts: {value: opts},
        server: {value: null, writable: true}
    });
};

WebGate.prototype.handler = function (req, res) {
    const reqProtocol = req.connection.encrypted ? "https" : "http";
    const reqUri = `${reqProtocol}://${req.headers.host}${req.url}`;
    const next = arguments[2] || (err => {}); // as connect.js middleware
    if (req.url.search(this.opts.from) !== 0) return next();
    const reqPath = req.url.substring(this.opts.from.length);
    const chunks = [];
    req.on("data", chunk => {chunks.push(chunk);});
    req.on("end", () => {
        const body = Buffer.concat(chunks);
        const uri = path.join(this.opts.to, reqPath);
        const gateReq = this.space.request(
            req.method, reqUri, req.headers, body);
        const request = this.space.request(
            req.method, uri, req.headers, body, gateReq);
        this.space.access(request).then(a => Promise.all(a)).then(reqres  => {
            const request = reqres[0], response = reqres[1];
            res.writeHead(response.status, response.headers);
            res.end(response.body);
        });
    });
};

WebGate.prototype.start = function (port, host, httpsOpts) {
    if (this.server) return false;
    if (httpsOpts) {
        this.server = protocols.https.createServer(
            httpsOpts, (req, res) => this.handler(req, res));
    } else {
        this.server = protocols.http.createServer(
            (req, res) => this.handler(req, res));
    }
    this.server.on("error", err => {
        console.log(err);
    });
    this.server.listen(port, host);
    this.server.url = `${httpsOpts ? "https" : "http"}://${
        host || "localhost"}:${port}/`;
    return true;
};
WebGate.prototype.stop = function () {
    if (!this.server) return false;
    this.server.close();
    this.server = null;
    return true;
};


exports.WebGate = WebGate;
