"use strict";

window.addEventListener("agent-load", function (ev) {
    var publicPem = "";

    var replyPublicPem = function (ev) {
        ev.detail.respond("200", {
            "content-type": "text/plain;charset=utf-8"
        }, publicPem);
    };

    var postPublicPem = function (ev) {
        var publicPem_ = ev.detail.request.body.toString();
        if (publicPem_) publicPem = publicPem_;
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return replyPublicPem(ev);
            case "POST": return postPublicPem(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
