/*global anatta*/
"use strict";

window.addEventListener("agent-load", ev => {
    const insts = document.getElementById("insts");
    const instTemplate = document.querySelector(".inst");
    const url = anatta.builtin.url;

    const getInst = (entity) => {
        const inst = entity.html.querySelector("[rel='inst']");
        const link = anatta.engine.link(inst, "text/html", entity);
        return link.get().then(entity => entity.json);
    };

    const getUI = (instID, manifest) => {
        const name = manifest.html.getElementById("name");
        const nameText = name ? name.textContent : "";
        const ui = manifest.html.querySelector("[rel='ui']");
        const uiPath = ui ? url.parse(ui.href).path : "";
        const desc = manifest.html.getElementById("description");
        const descText = desc ? desc.textContent : "";
        const info = instTemplate.cloneNode(true);
        info.setAttribute("rel", nameText);
        info.querySelector(".id").textContent = instID;
        info.querySelector(".id").href = uiPath;
        info.querySelector(".description").textContent = descText;
        insts.appendChild(info);
    };

    const generateID = (name) => {
        const selector = `[class='inst'][rel='${name}']`;
        const num = insts.querySelectorAll(selector).length;
        return `${name}/${num + 1}`;
    };

    const post = (ev) => {
        const form = anatta.form.decode(ev.detail.request);
        const link = anatta.engine.link({href: form.instUri});
        return link.get().then(getInst).then(inst => {
            inst.id = generateID(inst.name);
            inst.root = ev.detail.request.href;
            inst.src = form.instUri;
            return Promise.all([
                inst.id, anatta.inst.activate(anatta.engine, inst)]);
        }).then(a => getUI(...a)).then(() => ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, ""), err => ev.detail.respond("400", {
            "content-type": "text/html;charset=utf-8"
        }, `something wrong ...${"\n\n"}${err}`));
    };

    const get = (ev) => {
        const doc = document.implementation.createHTMLDocument("insts");
        doc.body.appendChild(doc.importNode(insts, true));
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, doc.documentElement.outerHTML);
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
        case "GET": return get(ev);
        case "POST": return post(ev);
        default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
