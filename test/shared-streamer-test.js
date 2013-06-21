"use strict";

var assert = require("assert");
suite("[shared/streamer]");
test("post", function (done) {
    var anatta = require("../anatta");
    
    var engine = anatta.engine.builder.engine({
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
    
    var formdata = {
        action: "tweet",
        content: "Hello World!",
        tag: "tweet",
        actorName: "Taro",
        actorHref: "persona:taro@persona.net",
        targetHref: "http://taro.persona.net/",
        targetName: "Taro status",
    };
    
    var streams = engine.link({href: "root:/streams/"});
    var msg = anatta.metadata.multipart.encode5(formdata);
    streams.post(msg).then(function (entity) {
        assert.equal(entity.response.status, "200");
        return streams.get();
    }).then(function (index) {
        //console.log(index.response.text());
        return index.first({rel: "origin"}).get();
    }).then(function (activity) {
        //console.log(activity.response.text());
        assert.equal(activity.attr("content"), formdata.content);
    }).then(done, done);
});
