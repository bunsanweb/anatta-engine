/*global anatta*/
"use strict";
window.addEventListener("agent-load", ev => {
    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        if (ev.detail.request.method === "GET") {
            const uri = `private:${ev.detail.request.location.path}`;
            anatta.engine.link({href: uri}).get().then(entity => {
                const res = entity.response;
                ev.detail.respond(res.status, res.headers, res.body);
            });
        }
    }, false);
}, false);
