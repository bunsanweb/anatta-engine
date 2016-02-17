"use strict";

window.addEventListener("agent-load", ev => {
    const pubkeyPems = []

    const getPems = (ev) => ev.detail.respond("200", {
        "content-type": "application/json",
    }, JSON.stringify(pubkeyPems));
    

    const postPem = (ev) => {
        const form = anatta.form.decode(ev.detail.request);
        if (form && form.pem) {
            const pem = form.pem.replace(/\r/g, "");
            if (anatta.cipher.isPublicKeyPem(pem)) {
                pubkeyPems.push(pem);
                ev.detail.respond("200", {
                    "content-type": "text/plain;charset=utf-8"
                }, "");
                return;
            }
        }
        ev.detail.respond("400", {
            "content-type": "text/plain;charset=utf-8"
        }, "400 Bad Request");
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return getPems(ev);
            case "POST": return postPem(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
