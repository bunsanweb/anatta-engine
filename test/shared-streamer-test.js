/*eslint prefer-arrow-callback: 0*/
"use strict";

const assert = require("assert");
suite("[shared/streamer]");
test("post", function (done) {
    const anatta = require("../anatta");
    
    const engine = anatta.engine.builder.engine({
        type: "generic",
        porter: {
            "text/html": "html",
            "application/json": "json",
            "application/atom+xml": "atom",
        },
        space: {
            "src:": {
                field: "file", root: "./test/assets/streamer/streams/",
                prefix: "/"},
            "src:/shared/": {field: "file", root: anatta.shared(),
                             prefix: "/shared/"},
            "src:/streamer/": {
                field: "file", root: anatta.shared("./streamer/"),
                prefix: "/streamer/"},
            "orb:": {field: "orb", cache: false},
            "root:/": {
                field: "file", root: "./test/assets/streamer/ui/",
                prefix: "/"},
            "root:/streamer/": {
                field: "file", root: anatta.shared("./streamer/"),
                prefix: "/streamer/"},
            "root:/streams": {field: "agent", uri: "src:/index.html"},
        },
    });
    engine.glossary.add(anatta.termset.desc.create({
        name: "streamer-list",
        "content-type": "text/html",
        "uri-patterm": "^root:/streamer/",
        link: {
            rel: {value: "rel"},
        },
    }));
    engine.glossary.add(anatta.termset.desc.create({
        name: "streamer-activity",
        "content-type": "text/html",
        "uri-patterm": "^root:/streamer/act-",
        entity: {
            content: {selector: "[rel=content]", value: "textContent"},
        },
        link: {
            rel: {value: "rel"},
        },
    }));
    
    const formdata = {
        action: "tweet",
        content: "Hello World!",
        tag: "tweet",
        actorName: "Taro",
        actorHref: "persona:taro@persona.net",
        targetHref: "http://taro.persona.net/",
        targetName: "Taro status",
    };
    
    const streams = engine.link({href: "root:/streams/"});
    const msg = anatta.metadata.multipart.encode5(formdata);
    streams.post(msg).then(entity => {
        assert.equal(entity.response.status, "200");
        return streams.get();
    }).then(index => index.first({rel: "origin"}).get()).then(activity => {
        //console.log(activity.response.text());
        assert.equal(activity.attr("content"), formdata.content);
    }).then(done, done);
});
