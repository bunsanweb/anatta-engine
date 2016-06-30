/*global anatta*/
"use strict";

window.addEventListener("agent-load", ev => {
    let text = "";
    const keybox = anatta.engine.link(
        document.getElementById("keybox"), "text/html", anatta.entity);

    const formatPem = (pem) => {
        const elems = pem.split("\n");
        const pad = " ... ";
        return elems.slice(1, 5).map(
            e => `${e.slice(0, 4)}${pad}${e.slice(-4)}`).join(pad);
    };

    const formatMessage = () => {
        const doc = document.implementation.createHTMLDocument("message");
        const div = doc.createElement("div");
        div.id = "message";
        div.textContent = text;
        doc.body.appendChild(div);
        const ul = doc.createElement("ul");
        ul.id = "pubkeys";
        return keybox.get().then(entity => {
            const pubkeyPems = JSON.parse(entity.response.body.toString());
            pubkeyPems.forEach(pem => {
                const li = doc.createElement("li");
                li.textContent = formatPem(pem);
                ul.appendChild(li);
            });
            doc.body.insertBefore(ul, doc.body.firstChild);
            return doc;
        });
    };

    const getMessage = (ev) => {
        formatMessage().then(message => ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8",
        }, message.documentElement.outerHTML));
    };

    const postMessage = (ev) => {
        const form = anatta.form.decode(ev.detail.request);
        if (form && form.text) text = form.text;
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
        case "GET": return getMessage(ev);
        case "POST": return postMessage(ev);
        default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
