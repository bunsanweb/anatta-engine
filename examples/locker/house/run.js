"use strict";

const anatta = require("../../../anatta");
const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json"
    },
    space: {
        "http:": {field: "web"},
        "https:": {field: "web"},
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "lib:/": {field: "file", root: "../lib/", prefix: "/"},
        "root:/": {field: "agent", uri: "file:/gatekeeper.html"},
        "private:/keybox": {field: "agent", uri: "file:/keybox.html"},
        "private:/message": {field: "agent", uri: "file:/message.html"},
    }
});
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});

const port = process.argv[2] || process.env.PORT || "8000";
const adminPubKeyUri = process.argv[3];
if (!adminPubKeyUri) process.exit(1);

engine.link({href: adminPubKeyUri}).get().then(entity => {
    const form = anatta.metadata.multipart.encode({
        pem: entity.response.body.toString()
    });
    engine.link({href: "private:/keybox"}).post(form);
});

const fs = require("fs");
gate.start(port, "localhost", {
    key: fs.readFileSync("../../../test/assets/https/privatekey.pem"),
    cert: fs.readFileSync("../../../test/assets/https/certificate.pem")
});
