"use strict";

window.addEventListener("agent-load", function (ev) {
    var priv = "";
    var pub = "";
    var house = "";
    var keybox = anatta.engine.link(
        document.getElementById("keybox"), "text/html", anatta.entity);
    var load = function () {
        priv = anatta.cipher.generate();
        var publicPem = priv.getPublicPem();
        pub = anatta.cipher.load(publicPem);
        keybox.post({
            headers: {"content-type": "text/plain;charset=utf-8"},
            body: publicPem
        });
    };
    load();

    var auth = function (entity) {
        if (entity.response.status != "401") return entity;

        var challenge = entity.response.headers["www-authenticate"];
        if (!challenge) return entity;

        var parsed = LockerAuth.parse(challenge);
        if (parsed.scheme != LockerAuth.scheme) return entity;

        var signed = priv.sign(parsed.param);
        if (signed.error) return entity;

        entity.request.headers.authorization = LockerAuth.format(signed);
        return entity.post(entity.request);
    };

    var insertLink = function (doc) {
        if (doc.head) {
            var link = doc.createElement("link");
            link.rel = "house";
            link.href = house;
            doc.head.appendChild(link);
        }
        return doc;
    };

    var respond = function (entity) {
        var res = entity.response;
        var doc = entity.html;
        var resText = doc ? insertLink(doc).outerHTML : res.body.toString();
        this.detail.respond(res.status, res.headers, resText);
    };

    var postToHouse= function (ev) {
        var status = "400";
        var responseText = "400 Bad Request, house is not registered";
        var req = ev.detail.request;
        var form = anatta.form.decode(req);
        if (form) {
            if (form.house) {
                house = form.house;
                status = "200";
                responseText = house + " is registered as house";
            } else if (house) {
                var link = anatta.engine.link({href: house});
                return link.post(req).then(auth).then(respond.bind(ev));
            }
        }
        ev.detail.respond(status, {
            "content-type": "text/html;charset=utf-8"
        }, responseText);
    };

    var getFromHouse = function (ev) {
        if (house) {
            anatta.engine.link({href: house}).get().then(respond.bind(ev));
        } else {
            ev.detail.respond("400", {
                "content-type": "text/html;charset=utf-8"
            }, "400 Bad Request, house is not registered");
        }
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return getFromHouse(ev);
            case "POST": return postToHouse(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
