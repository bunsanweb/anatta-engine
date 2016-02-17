"use strict";

window.addEventListener("agent-load", ev => {
    const keybox = anatta.engine.link(
        document.getElementById("keybox"), "text/html", anatta.entity);
    const message = anatta.engine.link(
        document.getElementById("message"), "text/html", anatta.entity);

    const verify = (authParam) => {
        return keybox.get().then(entity => {
            const pubkeyPems = JSON.parse(entity.response.body.toString());
            return pubkeyPems.some(pem => {
                const pubkey = anatta.cipher.load(pem);
                return pubkey.verify(authParam);
            });
        });
    };

    const respond = (ev) => (entity) => {
        const res = entity.response;
        ev.detail.respond(res.status, res.headers, res.body.toString());
    };

    const respondChallenge = (ev) => {
        const status = "401";
        const headers = {
            "content-type": "text/html;charset=utf-8",
            "WWW-Authenticate": LockerAuth.wwwAuthenticate
        };
        const responseText = "HTTP/1.1 401 Unauthorized";
        ev.detail.respond(status, headers, responseText);
    };

    const doPost = (ev) => {
        const form = anatta.form.decode(ev.detail.request);
        if (!form || !form.pem || !form.text) {
            ev.detail.respond("400", {
                "content-type": "text/html;charset=utf-8"
            }, "400 Bad Rquest");
        }
        const target = form.pem ? keybox : message;
        return target.post(ev.detail.request).then(respond(ev));
    };

    const post = (ev) => {
        const authStr = ev.detail.request.headers.authorization;
        if (!authStr) return respondChallenge(ev);

        const parsed = LockerAuth.parse(authStr);
        if (parsed.scheme != LockerAuth.scheme) return respondChallenge(ev);

        return verify(parsed.param).then(
            authOK => authOK ? doPost(ev) : respondChallenge(ev));
    };

    const get = (ev) => message.get().then(respond(ev));

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return get(ev);
            case "POST": return post(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
