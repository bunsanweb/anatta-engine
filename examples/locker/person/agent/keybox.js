"use strict";

window.addEventListener("agent-load", ev => {
    let publicPem = "";

    const getPublicPem = (ev) => ev.detail.respond("200", {
        "content-type": "text/plain;charset=utf-8"
    }, publicPem);
    
    const postPublicPem = (ev) => {
        const publicPem_ = ev.detail.request.body.toString();
        if (publicPem_) publicPem = publicPem_;
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return getPublicPem(ev);
            case "POST": return postPublicPem(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
