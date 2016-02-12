"use strict";
window.addEventListener("agent-load", ev => {
    const url = document.getElementById("url").href;
    const link = anatta.engine.link({href: url});
    const contents = document.createElement("div");
    const template = document.querySelector(".newsitem");
    
    const content = (entry) => {
        var item = template.cloneNode(true);
        item.querySelector(".href").href = entry.attr("href");
        item.querySelector(".title").textContent = entry.attr("title");
        item.querySelector(".date").textContent = entry.attr("date");
        item.querySelector(".desc").innerHTML = entry.attr("desc");
        return item;
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        link.get().then(entity => {
            entity.all().map(content).forEach(contents.appendChild, contents);
            ev.detail.respond(200, {
                "content-type": "text/html;charset=utf-8"
            }, contents.innerHTML);
        });
    }, false);
}, false);
