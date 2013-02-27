"use strict";

window.addEventListener("agent-load", function (ev) {
    var keybox = anatta.engine.link(
        document.getElementById("keybox"), "text/html", anatta.entity);
    var message = anatta.engine.link(
        document.getElementById("message"), "text/html", anatta.entity);

    var verify = function (authParam) {
        return keybox.get().then(function (entity) {
            var pubkeyPems = JSON.parse(entity.response.body.toString());
            return pubkeyPems.some(function (pem) {
                var pubkey = anatta.cipher.load(pem);
                return pubkey.verify(authParam);
            });
        });
    };

    var respond = function (entity) {
        var res = entity.response;
        this.detail.respond(res.status, res.headers, res.body.toString());
    };

    var respondChallenge = function (ev) {
        var status = "401";
        var headers = {
            "content-type": "text/html;charset=utf-8",
            "WWW-Authenticate": LockerAuth.wwwAuthenticate
        };
        var responseText = "HTTP/1.1 401 Unauthorized";
        ev.detail.respond(status, headers, responseText);
    };

    var doPost = function (ev) {
        var form = anatta.form.decode(ev.detail.request);
        if (!form || !form.pem || !form.text) {
            ev.detail.respond("400", {
                "content-type": "text/html;charset=utf-8",
            }, "400 Bad Rquest");
        }
        var target = "";
        if (form.pem) target = keybox;
        if (form.text) target = message;
        return target.post(ev.detail.request).then(respond.bind(ev));
    };

    var post = function (ev) {
        var authStr = ev.detail.request.headers.authorization;
        if (!authStr) return respondChallenge(ev);

        var parsed = LockerAuth.parse(authStr);
        if (parsed.scheme != LockerAuth.scheme) return respondChallenge(ev);

        verify(parsed.param).then(function (authOK) {
            return authOK ? doPost(ev) : respondChallenge(ev);
        });
    };

    var get = function (ev) {
        message.get().then(respond.bind(ev));
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return get(ev);
            case "POST": return post(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
