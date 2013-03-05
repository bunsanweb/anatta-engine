"use strict";

window.addEventListener("agent-load", function (ev) {
    var packages = document.getElementById("packages");
    var packageTemplate = document.querySelector(".package");
    var url = anatta.builtin.url;

    var toManifest = function (entity) {
        var root = entity.request.href;
        var manifest = entity.html.querySelector("[rel='manifest']");
        var link = anatta.engine.link(manifest, "text/html", entity);
        return link.get().then(function (entity) {
            var id = entity.html.getElementById("id");
            var desc = entity.html.getElementById("description");
            var config = entity.html.querySelector("[rel='config']");
            var ui = entity.html.querySelector("[rel='ui']");
            return {
                id: id ? id.textContent : "",
                root: url.resolve(root, "/"),
                description: desc ? desc.textContent : "",
                config: config ? config.href : "",
                ui: ui ? url.parse(ui.href).path.slice(1) : ""
            };
        });
    };

    var createPackageInfo = function (manifest) {
        var info = packageTemplate.cloneNode(true);
        info.querySelector(".id").textContent = manifest.id;
        info.querySelector(".id").href = manifest.uri;
        info.querySelector(".description").textContent = manifest.description;
        return info;
    };

    var install = function (root, manifest) {
        var link = anatta.engine.link({href: manifest.config});
        return link.get().then(function (entity) {
            var json = entity.response.text();
            json = json.replace("PACKAGE_ROOT", manifest.root);
            manifest.config = JSON.parse(json);
            manifest = anatta.install(anatta.engine, root, manifest);
            packages.appendChild(createPackageInfo(manifest));
        });
    };

    var post = function (ev) {
        var form = anatta.form.decode(ev.detail.request);
        var link = anatta.engine.link({href: form.packageUri});
        return link.get().then(toManifest).then(function (manifest) {
            return install(ev.detail.request, manifest);
        }).then(function () {
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
        var doc = document.implementation.createHTMLDocument("packages");
        doc.body.appendChild(doc.importNode(packages, true));
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
