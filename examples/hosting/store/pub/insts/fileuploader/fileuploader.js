"use strict";
window.addEventListener("agent-load", function (ev) {
    var files = document.querySelector("#files");
    var root = "";
    var orb = document.querySelector("link[rel='orb']").getAttribute("href");

    var updateFiles = function (file) {
        console.log(orb);
        var url = orb + "/" + encodeURIComponent(file.filename);
        var a = document.createElement("a");
        a.setAttribute("href", url);
        a.textContent = file.filename;
        var li = document.createElement("li");
        li.appendChild(a);
        files.appendChild(li);
    };

    var putOrb = function (file) {
        var path = orb + "/" + encodeURIComponent(file.filename);
        var url = anatta.builtin.url.resolve(root, path);
        return anatta.engine.link({href: url}).put(file);
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        root = ev.detail.request.href;
        var render = function () {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, files.outerHTML);
        };
        if (ev.detail.request.method == "GET") return render();
        if (ev.detail.request.method == "POST") {
            var formdata = anatta.form.decode(ev.detail.request);
            return anatta.q.all(formdata.file.map(putOrb)).then(function () {
                formdata.file.map(updateFiles);
            }).then(render);
        }
    }, false);
}, false);
