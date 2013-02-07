"use strict";
window.addEventListener("agent-load", function (ev) {
    var url = anatta.builtin.url;
    var rootUri = document.getElementById("rootUri").href;
    var root = anatta.engine.link({href: rootUri});
    var container = document.querySelector(".container").cloneNode(true);
    var contents = container.querySelector(".contents");
    var contentTemplate = document.querySelector(".content");

    var setContainer = function (entity) {
        var item = entity.html.querySelector(".subtext > a[href^='item?']");
        var itemHref = url.resolve(rootUri, item.getAttribute("href"));
        var itemAncestor = item.parentNode.parentNode;
        var title = itemAncestor.previousSibling.querySelector(".title > a");
        container.querySelector(".title").textContent = title.textContent;
        container.querySelector(".href").href = itemHref;
        container.querySelector(".href").textContent = itemHref;
    };

    var getPages = function (pages, href) {
        var link = anatta.engine.link({href: href});
        return link.get().then(function (entity) {
            pages.push(entity.html);
            var more = entity.html.querySelector("a[href^='/x?fnid']");
            if (more) {
                var moreHref = more.getAttribute("href");
                return getPages(pages, url.resolve(rootUri, moreHref));
            } else {
                var deferred = anatta.q.defer();
                deferred.resolve(pages);
                return deferred.promise;
            }
        });
    };

    var getOuterLinks = function (document) {
        return Array.prototype.filter.call(document.querySelectorAll("a"),
                function (a) {
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
            return getPages([], itemHref);
        }).then(function (pages) {
            var links = pages.map(function (page) {
                return getOuterLinks(page);
            }).reduce(function (prev, cur) {
                return prev.concat(cur);
            });
            return anatta.q.all(links.map(function (link) {
                return anatta.engine.link({href: link.href}).get();
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
