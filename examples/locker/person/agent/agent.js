/*global LockerAuth*/
"use strict";

window.addEventListener("agent-load", ev => {
    let house = "";
    const keybox = anatta.engine.link(
        document.getElementById("keybox"), "text/html", anatta.entity);

    const priv = anatta.cipher.generate();
    keybox.post({
        headers: {"content-type": "text/plain;charset=utf-8"},
        body: priv.getPublicPem()
    });

    const auth = (entity) => {
        if (+entity.response.status !== 401) return entity;

        const challenge = entity.response.headers["www-authenticate"];
        if (!challenge) return entity;

        const parsed = LockerAuth.parse(challenge);
        if (parsed.scheme !== LockerAuth.scheme) return entity;

        const signed = priv.sign(parsed.param);
        if (signed.error) return entity;

        entity.request.headers.authorization = LockerAuth.format(signed);
        return entity.post(entity.request);
    };

    const insertLink = (doc) => {
        if (doc.head) {
            const link = doc.createElement("link");
            link.rel = "house";
            link.href = house;
            doc.head.appendChild(link);
        }
        return doc;
    };

    const respond = (ev) => (entity) => {
        const res = entity.response;
        const doc = entity.html;
        const resText = doc ? insertLink(doc).documentElement.outerHTML :
                  res.body.toString();
        ev.detail.respond(res.status, res.headers, resText);
    };

    const postToHouse = (ev) => {
        const req = ev.detail.request;
        const form = anatta.form.decode(req);
        if (form) {
            if (form.house) {
                house = form.house;
                return ev.detail.respond("200", {
                    "content-type": "text/plain;charset=utf-8"
                }, `${house} is registered as house`);
            } else if (house) {
                const link = anatta.engine.link({href: house});
                return link.post(req).then(auth).then(respond(ev));
            }
        }
        return ev.detail.respond("400", {
            "content-type": "text/html;charset=utf-8"
        }, "400 Bad Request, house is not registered");
    };

    const getFromHouse = (ev) => {
        if (house) {
            anatta.engine.link({href: house}).get().then(respond(ev));
        } else {
            ev.detail.respond("400", {
                "content-type": "text/html;charset=utf-8"
            }, "400 Bad Request, house is not registered");
        }
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
        case "GET": return getFromHouse(ev);
        case "POST": return postToHouse(ev);
        default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
