"use strict";

window.addEventListener("agent-load", function (ev) {
    var priv = "";
    var pub = "";
    var house = "";
    var load = function () {
        priv = anatta.cipher.generate();
        var publicPem = priv.getPublicPem();
        pub = anatta.cipher.load(publicPem);
        var pubkey = document.getElementById("pubkey");
        anatta.engine.link(pubkey, "text/html", anatta.entity).post({
            headers: {"content-type": "text/plain;charset=utf-8"},
            body: publicPem
        });
    };
    load();

    var parseChallenge = function (challenge) {
        var index = challenge.indexOf(" ");
        var scheme = challenge.slice(0, index).trim();
        var param = {};
        challenge.slice(index).split(",").forEach(function (elem) {
            var elems = elem.split("=");
            param[elems[0].trim()] = elems[1].trim().slice(1, -1);
        });
        return {scheme: scheme, param: param};
    };

    var formatAuth = function (parsedChallenge, resultObj) {
        var str = "";
        Object.keys(resultObj).forEach(function (key) {
            str += key + '="' + resultObj[key] + '", ';
        });
        return parsedChallenge.scheme + " " + str.slice(0, -2);
    };

    var auth = function (entity) {
        if (entity.response.status != "401") return entity;

        var challenge = entity.response.headers["www-authenticate"];
        if (!challenge) return entity;

        var parsed = parseChallenge(challenge);
        if (parsed.scheme != "sign") return entity;

        var signed = priv.sign(parsed.param);
        if (signed.error) return entity;

        entity.request.headers.authorization = formatAuth(parsed, signed);
        return entity.post(entity.request);
    };

    var respond = function (entity) {
        var res = entity.response;
        this.detail.respond(res.status, res.headers, res.body.toString());
    };

    var postToHouse= function (ev) {
        house = anatta.form.decode(ev.detail.request).house;
        if (house) {
            var link = anatta.engine.link({href: house});
            link.post(ev.detail.request).then(auth).then(respond.bind(ev));
        } else {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, "");
        }
    };

    var getFromHouse = function (ev) {
        if (house) {
            anatta.engine.link({href: house}).get().then(respond.bind(ev));
        } else {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, "");
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
