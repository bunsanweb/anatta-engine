"use strict";

window.addEventListener("agent-load", function (ev) {
    var insts = document.getElementById("insts");
    var instTemplate = document.querySelector(".inst");
    var url = anatta.builtin.url;

    var getInst = function (entity) {
        var inst = entity.html.querySelector("[rel='inst']");
        var link = anatta.engine.link(inst, "text/html", entity);
        return link.get().then(function (entity) {
            return JSON.parse(entity.response.text());
        });
    };

    var getUI = function (inst) {
        var link = anatta.engine.link({href: inst.manifest});
        return link.get().then(function (entity) {
            var ui = entity.html.querySelector("[rel='ui']");
            var uiPath = ui ? url.parse(ui.href).path : "";
            var desc = entity.html.getElementById("description");
            var descText = desc ? desc.textContent : "";
            var info = instTemplate.cloneNode(true);
            info.querySelector(".id").textContent = inst.id;
            info.querySelector(".id").href = uiPath;
            info.querySelector(".description").textContent = descText;
            insts.appendChild(info);
        });
    };

    var post = function (ev) {
        var form = anatta.form.decode(ev.detail.request);
        var link = anatta.engine.link({href: form.instUri});
        return link.get().then(getInst).then(function (inst) {
            inst.root = ev.detail.request.href;
            inst.src = form.instUri;
            return anatta.inst.activate(anatta.engine, inst);
        }).then(getUI).then(function () {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, "");
        }, function (err) {
            ev.detail.respond("400", {
                "content-type": "text/html;charset=utf-8"
            }, "something wrong ...\n\n" + err);
        });
    };

    var get = function (ev) {
        var doc = document.implementation.createHTMLDocument("insts");
        doc.body.appendChild(doc.importNode(insts, true));
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, doc.outerHTML);
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
