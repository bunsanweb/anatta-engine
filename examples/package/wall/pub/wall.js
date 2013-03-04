"use strict";
window.addEventListener("agent-load", function (ev) {
    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        if (ev.detail.request.method == "PUT") {
            var source = window.anatta.form.decode(ev.detail.request).source;
            document.querySelector("#text").textContent = source;
            document.querySelector("#date").textContent = new Date();
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, document.querySelector("#content").outerHTML);
    }, false);
}, false);
