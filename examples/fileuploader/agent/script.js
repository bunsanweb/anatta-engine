"use strict";
window.addEventListener("agent-load", function (ev) {
    var files = document.querySelector("#files");

    var updateFiles = function (file) {
        var url = "/orb/" + encodeURIComponent(file.filename);
        var a = document.createElement("a");
        a.setAttribute("href", url);
        a.textContent = file.filename;
        var li = document.createElement("li");
        li.appendChild(a);
        files.appendChild(li);
    };

    var putOrb = function (file) {
        var url = "root:/orb/" + encodeURIComponent(file.filename);
        window.anatta.engine.link({href: url}).put(file);
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        if (ev.detail.request.method == "POST") {
            var file = window.anatta.form.decode(ev.detail.request).file;
            updateFiles(file);
            putOrb(file);
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, files.outerHTML);
    }, false);
}, false);
