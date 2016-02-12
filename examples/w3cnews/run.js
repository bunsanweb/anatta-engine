"use strict";

const anatta = require("../../anatta");

const engine = anatta.engine.builder.engine({
    type: "generic",
    porter: {
        "text/html": "html",
        "application/json": "json",
        "application/atom+xml": "atom",
    },
    space: {
        "http:": {field: "web"},
        "https:": {field: "web"},
        "file:": {field: "file", root: "./agent/", prefix: "/"},
        "root:/": {field: "file", root: "./pub/", prefix: "/"},
        "root:/agent/": {field: "agent", uri: "file:/index.html"},
    }
});
const termset = anatta.termset.desc.create({
    name: "w3cnews-feed",
    "content-type": "application/atom+xml",
    link: {
        href: {selector: "link[rel='alternate']", value: "href"},
        title: {selector: "entry > title", value: "textContent"},
        date: {selector: "updated", value: "textContent"},
        desc: {selector: "entry > content", value: "textContent"},
    },
});
engine.glossary.add(termset);
const gate = anatta.webgate.core.WebGate(
    engine.space, {from: "/", to: "root:/"});
gate.start(process.env.PORT || "8000");
