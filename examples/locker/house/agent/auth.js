"use strict";

window.addEventListener("agent-load", function (ev) {
    var pubkey = document.getElementById("pubkey");
    var message = document.getElementById("message");
    var challenge = {
        alg: "sha256",
        buf: "this is my house",
        bufEncoding: "utf8",
        signEncoding: "hex"
    };

    var parseAuth = function (authStr) {
        var index = authStr.indexOf(" ");
        var scheme = authStr.slice(0, index).trim();
        var param = {};
        authStr.slice(index).split(",").forEach(function (elem) {
            var elems = elem.split("=");
            param[elems[0].trim()] = elems[1].trim().slice(1, -1);
        });
        return {scheme: scheme, param: param};
    };

    var verify = function (param) {
        var link = anatta.engine.link(pubkey, "text/html", anatta.entity);
        return link.get().then(function (entity) {
            var pubkeyPems = JSON.parse(entity.response.body.toString());
            return pubkeyPems.some(function (pem) {
                var pubkey = anatta.cipher.load(pem);
                return pubkey.verify(param);
            });
        });
    };

    var respond = function (entity) {
        var res = entity.response;
        this.detail.respond(res.status, res.headers, res.body.toString());
    };

    var respondChallenge = function (ev) {
        var status = "401";
        var challengeStr = "";
        Object.keys(challenge).forEach(function (key) {
            challengeStr += key + '="' + challenge[key] + '", ';
        }); 
        var headers = {"WWW-Authenticate": "sign " + challengeStr.slice(0, -2)};
        var body = "HTTP/1.1 401 Unauthorized";
        ev.detail.respond(status, headers, body);
    };

    var doPost = function (ev) {
        var req = ev.detail.request;
        var form = anatta.form.decode(req);
        var target = "";
        if (form.pem) target = pubkey;
        if (form.text) target = message;
        var link = anatta.engine.link(target, "text/html", anatta.entity);
        return link.post(req).then(respond.bind(ev));
    };

    var post = function (ev) {
        var authStr = ev.detail.request.headers.authorization;
        if (!authStr) return respondChallenge(ev);

        var parsed = parseAuth(authStr);
        if (parsed.scheme != "sign") return respondChallenge(ev);

        verify(parsed.param).then(function (result) {
            return result ? doPost(ev) : respondChallenge(ev);
        });
    };

    var get = function (ev) {
        var link = anatta.engine.link(message, "text/html", anatta.entity);
        link.get().then(respond.bind(ev));
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
