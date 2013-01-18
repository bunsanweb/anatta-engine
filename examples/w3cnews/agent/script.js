"use strict";
window.addEventListener("agent-load", function (ev) {
    var url = "http://www.w3.org/News/atom.xml";
    var w3cnews = anatta.engine.link({href: url});

    var content = function (entry) {
        var h3 = document.createElement("h3");
        h3.textContent = entry.attr("title");
        var h4 = document.createElement("h4");
        h4.textContent = entry.attr("date");
        var p = document.createElement("p");
        p.textContent = entry.attr("desc");
        var li = document.createElement("li");
        li.appendChild(h3);
        li.appendChild(h4);
        li.appendChild(p);
        return li;
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        var contents = document.createElement("ul");
        w3cnews.get().then(function (entity) {
            anatta.q.all(entity.all().map(function (entry) {
                contents.appendChild(content(entry));
            })).then(function () {
                ev.detail.respond(200, {
                    "content-type": "text/html;charset=utf-8"
                }, contents.innerHTML);
            });
        });
    }, false);
}, false);
