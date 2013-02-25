"use strict";

var anatta = require("../../../anatta");
var engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json"
    },
    space: {
        "http:": {field: "web"},
        "https:": {field: "web"},
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "root:/": {field: "agent", uri: "file:/auth.html"},
        "root:/message": {field: "agent", uri: "file:/message.html"},
        "private:/pubkey": {field: "agent", uri: "file:/pubkey.html"},
    }
});
var gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});

var port = process.argv[2] || process.env.PORT || "8000";
var adminPubKeyUri = process.argv[3];
if (!adminPubKeyUri) {
    process.exit(1);
} else {
    engine.link({href: adminPubKeyUri}).get().then(function (entity) {
        var form = anatta.metadata.multipart.encode({
            pem: entity.response.body.toString()
        });
        engine.link({href: "private:/pubkey"}).post(form);
    });
}

var fs = require("fs");
gate.start(port, "localhost", {
    key: fs.readFileSync("../../../test/assets/https/privatekey.pem"),
    cert: fs.readFileSync("../../../test/assets/https/certificate.pem")
});
