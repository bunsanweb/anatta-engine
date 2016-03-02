"use strict";

const http = require("http");
const https = require("https");
const url = require("url");
const path = require("path");
const conftree = require("../conftree");


const states = new WeakMap();

const readFull = (rs, cb) => {
    const chunks = [];
    rs.on("data", chunk => chunks.push(chunk));
    rs.on("end", () => cb(Buffer.concat(chunks)));
};

const WebGate = class WebGate {
    static new(space, opts) {return Object.freeze(new WebGate(space, opts));}
    constructor (space, opts) {
        opts = conftree.create(opts,  {from: "/", to: "me:/"});
        states.set(this, {space, opts, server: null});
    }
    handler(req, res) {
        const self = states.get(this);
        const next = arguments[2] || (err => {}); // as connect.js middleware
        const reqProtocol = req.connection.encrypted ? "https" : "http";
        const reqUri = `${reqProtocol}://${req.headers.host}${req.url}`;
        if (req.url.search(self.opts.from) !== 0) return next();
        const reqPath = req.url.substring(self.opts.from.length);
        const toUri = path.join(self.opts.to, reqPath);
        readFull(req, body => {
            const gateReq = self.space.request(
                req.method, reqUri, req.headers, body);
            const request = self.space.request(
                req.method, toUri, req.headers, body, gateReq);
            self.space.access(request).then(a => Promise.all(a)).then(
                reqres  => {
                    const request = reqres[0], response = reqres[1];
                    res.writeHead(response.status, response.headers);
                    res.end(response.body);
                });
        });
        return undefined;
    }

    start(port, host, httpsOpts) {
        const self = states.get(this);
        if (self.server) return false;
        
        const handler = (req, res) => this.handler(req, res);
        self.server = httpsOpts ?
            https.createServer(httpsOpts, handler) :
            http.createServer(handler);
        self.server.on("error", err => {console.log(err);});
        self.server.listen(port, host);
        self.server.url = `${httpsOpts ? "https" : "http"}://${
            host || "localhost"}:${port}/`;
        return true;
    }
    stop() {
        const self = states.get(this);
        if (!self.server) return false;
        self.server.close();
        self.server = null;
        return true;
    }
};

exports.WebGate = WebGate.new;
