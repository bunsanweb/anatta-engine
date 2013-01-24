"use strict";
window.addEventListener("agent-load", function (ev) {
    var files = document.querySelector("#files");

    var updateFiles = function (file) {
        var uri = "/orb/" + encodeURIComponent(file.filename);
        var a = document.createElement("a");
        a.setAttribute("href", uri);
        a.textContent = file.filename;
        var li = document.createElement("li");
        li.appendChild(a);
        files.appendChild(li);
    };

    var putOrb = function (file) {
        var uri = "private:/orb/" + encodeURIComponent(file.filename);
        return anatta.engine.link({href: uri}).put(file);
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
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
