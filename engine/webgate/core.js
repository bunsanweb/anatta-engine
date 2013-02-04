"use strict";

var protocols = {
    http: require("http"),
    https: require("https"),
};
var url = require("url");
var path = require("path");
var conftree = require("../conftree");

var WebGate = function WebGate(space, opts) {
    opts = conftree.create(opts,  {from: "/", to: "me:/"});
    return Object.create(WebGate.prototype, {
        space: {value: space},
        opts: {value: opts},
        server: {value: null, writable: true},
    });
};

WebGate.prototype.handler = function (req, res) {
    var reqProtocol = "http" + (req.connection.encrypted ? "s" : "");
    var reqUri = reqProtocol + "://" + req.headers.host + req.url;
    var next = arguments[2] || function (err) {}; // as connect.js middleware
    if (req.url.search(this.opts.from) !== 0) return next();
    var reqPath = req.url.substring(this.opts.from.length);
    var self = this;
    var chunks = [];
    req.on("data", function (chunk) {chunks.push(chunk);});
    req.on("end", function () {
        var body = Buffer.concat(chunks);
        var uri = path.join(self.opts.to, reqPath);
        var gateReq = self.space.request(
            req.method, reqUri, req.headers, body);
        var request = self.space.request(
            req.method, uri, req.headers, body, gateReq);
        self.space.access(request).spread(function (request, response) {
            res.writeHead(response.status, response.headers);
            res.end(response.body);
        });
    });
};

WebGate.prototype.start = function (port, host, httpsOpts) {
    if (this.server) return false;
    if (httpsOpts) {
        this.server = protocols.https.createServer(
            httpsOpts, this.handler.bind(this));
    } else {
        this.server = protocols.http.createServer(this.handler.bind(this));
    }
    this.server.on("error", function (err) {
        console.log(err);
    });
    this.server.listen(port, host);
    this.server.url = "http" + (httpsOpts ? "s" : "") + "://" +
        (host || "localhost") + ":" + port + "/";
    return true;
};
WebGate.prototype.stop = function () {
    if (!this.server) return false;
    this.server.close();
    this.server = null;
    return true;
};


exports.WebGate = WebGate;
