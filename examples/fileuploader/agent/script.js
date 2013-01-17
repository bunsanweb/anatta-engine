"use strict";
window.addEventListener("agent-load", function (ev) {
    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        var files = document.querySelector("#files");
        if (ev.detail.request.method == "POST") {
            var data = window.anatta.form.decode(ev.detail.request);
            var file = data.file;

            var url = "/orb/" + file.filename;
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.setAttribute("href", url);
            a.textContent = file.filename;
            li.appendChild(a);
            files.appendChild(li);

            var orb = window.anatta.engine.link({href: "root:" + url});
            orb.put(file);
            //orb.put(file).then(function (entity) {
            //    orb.get().then(function (entity) {
            //        console.log(entity.attr("content-type"));
            //        console.log(entity.response.body.toString());
            //    });
            //});
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, document.querySelector("#files").outerHTML);
    }, false);
}, false);
