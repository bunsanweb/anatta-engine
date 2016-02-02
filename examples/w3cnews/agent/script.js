"use strict";
window.addEventListener("agent-load", function (ev) {
    var url = document.getElementById("url").href;
    var link = anatta.engine.link({href: url});
    var contents = document.createElement("div");
    var template = document.querySelector(".newsitem");
    
    var content = function (entry) {
        var item = template.cloneNode(true);
        item.querySelector(".href").href = entry.attr("href");
        item.querySelector(".title").textContent = entry.attr("title");
        item.querySelector(".date").textContent = entry.attr("date");
        item.querySelector(".desc").innerHTML = entry.attr("desc");
        return item;
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        link.get().then(function (entity) {
            entity.all().map(content).forEach(contents.appendChild, contents);
            ev.detail.respond(200, {
                "content-type": "text/html;charset=utf-8"
            }, contents.innerHTML);
        });
    }, false);
}, false);
