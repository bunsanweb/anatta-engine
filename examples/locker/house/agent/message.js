"use strict";

window.addEventListener("agent-load", function (ev) {
    var text = "";
    var keybox = anatta.engine.link(
        document.getElementById("keybox"), "text/html", anatta.entity);

    var formatPem = function (pem) {
        var elems = pem.split("\n");
        var str = "";
        var pad = " ... ";
        [1, 2, 3, 4].forEach(function (i) {
            str += pad + elems[i].slice(0, 4) + pad + elems[i].slice(-4);
        });
        return str.slice(pad.length);
    };

    var formatMessage = function () {
        var doc = document.implementation.createHTMLDocument("message");
        var div = doc.createElement("div");
        div.id = "message";
        div.textContent = text;
        doc.body.appendChild(div);
        var ul = doc.createElement("ul");
        ul.id = "pubkeys";
        return keybox.get().then(function (entity) {
            var pubkeyPems = JSON.parse(entity.response.body.toString());
            pubkeyPems.forEach(function (pem) {
                var li = doc.createElement("li");
                li.textContent = formatPem(pem);
                ul.appendChild(li);
            });
            doc.body.insertBefore(ul, doc.body.firstChild);
            return doc;
        });
    };

    var getMessage = function (ev) {
        formatMessage().then(function (message) {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8",
            }, message.outerHTML);
        });
    };

    var postMessage = function (ev) {
        var form = anatta.form.decode(ev.detail.request);
        if (form && form.text) text = form.text;
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
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
