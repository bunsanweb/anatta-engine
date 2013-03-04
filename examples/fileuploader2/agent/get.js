"use strict";
window.addEventListener("agent-load", function (ev) {
    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        if (ev.detail.request.method == "GET") {
            var uri = "private:" + ev.detail.request.location.path;
            anatta.engine.link({href: uri}).get().then(function (entity) {
                var res = entity.response;
                ev.detail.respond(res.status, res.headers, res.body);
            });
        }
    }, false);
}, false);
