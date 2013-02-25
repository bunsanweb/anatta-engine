"use strict";

window.addEventListener("agent-load", function (ev) {
    var text = "";

    var postMessage = function (ev) {
        var form = anatta.form.decode(ev.detail.request);
        if (form && form.text) text = form.text;
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
    };

    var formatMessage = function (text) {
        var doc = document.implementation.createHTMLDocument("message");
        var div = doc.createElement("div");
        div.id = "message";
        div.textContent = text;
        doc.body.appendChild(div);
        return doc;
    };

    var getMessage = function (ev) {
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8",
        }, formatMessage(text).outerHTML);
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return getMessage(ev);
            case "POST": return postMessage(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
