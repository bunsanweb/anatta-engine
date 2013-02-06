"use strict";
window.addEventListener("agent-load", function (ev) {
    var rootUri = document.getElementById("rootUri").href;
    var root = anatta.engine.link({href: rootUri});
    var container = document.querySelector(".container").cloneNode(true);
    var contents = container.querySelector(".contents");
    var contentTemplate = document.querySelector(".content");

    var setContainer = function (entity) {
        var item = entity.html.querySelector(".subtext > a[href^='item?']");
        var itemHref = rootUri + item.getAttribute("href");
        var title  = item.parentNode.parentNode.previousSibling.querySelector(".title > a");
        container.querySelector(".title").textContent = title.textContent;
        container.querySelector(".href").href = itemHref;
        container.querySelector(".href").textContent = itemHref;
    };

    var getOuterLinks = function (document) {
        return Array.prototype.filter.call(
            document.querySelectorAll("a"), function (a) {
                return a.rel == "nofollow" && a.href.indexOf("http") == 0;
            });
    };

    var createContent = function (entity) {
        var content = contentTemplate.cloneNode(true);
        var uri = entity.request.uri;
        content.querySelector(".href").href = uri;
        content.querySelector(".href").textContent = uri;
        var contentType = entity.response.headers["content-type"];
        if (contentType.indexOf("text/html") == 0) {
            var titleText = entity.html.title || uri;
            content.querySelector(".title").textContent = titleText;
        } else {
            content.querySelector(".title").textContent = uri;
        }
        return content;
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        root.get().then(function (entity) {
            setContainer(entity);
            var itemHref = container.querySelector(".href").href;
            return anatta.engine.link({href: itemHref}).get();
        }).then(function (entity) {
            var links = getOuterLinks(entity.html);
            return anatta.q.all(Array.prototype.map.call(links, function (a) {
                return anatta.engine.link({href: a.href}).get();
            }));
        }).then(function (entities) {
            entities.forEach(function (entity) {
                contents.appendChild(createContent(entity));
            });
        }).then(function () {
            ev.detail.respond(200, {
                "content-type": "text/html;charset=utf-8"
            }, container.innerHTML);
        });
    }, false);
}, false);
