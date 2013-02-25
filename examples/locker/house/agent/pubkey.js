"use strict";

window.addEventListener("agent-load", function (ev) {
    var pubkeyPems = []

    var postPem = function (ev) {
        var status = "200";
        var responseText = "";
        var form = anatta.form.decode(ev.detail.request);
        if (form && form.pem) {
            var pem = form.pem.replace(/\r/g, "");
            if (anatta.cipher.isPublicKeyPem(pem)) {
                pubkeyPems.push(pem);
            } else {
                status = "400";
                responseText = "400 Bad Request";
            }
        }
        ev.detail.respond(status, {
            "content-type": "text/html;charset=utf-8"
        }, responseText);
    };

    var getPems = function (ev) {
        ev.detail.respond("200", {
            "content-type": "application/json",
        }, JSON.stringify(pubkeyPems));
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return getPems(ev);
            case "POST": return postPem(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
