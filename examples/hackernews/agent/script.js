"use strict";
window.addEventListener("agent-load", function (ev) {
    var url = anatta.builtin.url;
    var rootUri = document.getElementById("rootUri").href;
    var root = anatta.engine.link({href: rootUri});
    var container = document.querySelector(".container").cloneNode(true);
    var contents = container.querySelector(".contents");
    var contentTemplate = document.querySelector(".content");
    anatta.engine.glossary.add(anatta.termset.desc.create({
        name: "hackernews",
        "content-type": "text/html",
        "uri-pattern": "^" + rootUri + "*",
        entity: {
            topItemHref: {selector: "a[href^='item?id']", value: "href"},
            title: {selector: ".title > a", value: "textContent"},
            titleHref: {selector: ".title > a", value: "href"},
            moreHref: {selector: "a[href^='/x?fnid']", value: "href"},
            link: {selector: "a[href^='http'][rel='nofollow']"}
        }
    }));

    var setContainer = function (itemHref, title, titleHref) {
        container.querySelector(".href").href = titleHref;
        container.querySelector(".href").textContent = title;
        container.querySelector(".itemHref").href = itemHref;
        container.querySelector(".itemHref").textContent = itemHref;
    };

    var getPages = function (firstHref, href, title, titleHref, pages) {
        var link = anatta.engine.link({href: href});
        return link.get().then(function (entity) {
            title = entity.attr("title") || title;
            titleHref = entity.attr("titleHref") || titleHref;
            pages.push(entity);
            var moreHref = entity.attr("moreHref");
            if (moreHref) {
                var next = url.resolve(rootUri, moreHref);
                return getPages(firstHref, next, title, titleHref, pages);
            } else {
                var deferred = anatta.q.defer();
                deferred.resolve([firstHref, title, titleHref, pages]);
                return deferred.promise;
            }
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
            var href = url.resolve(rootUri, entity.attr("topItemHref"));
            return getPages(href, href, "", "", []);
        }).spread(function (itemHref, title, titleHref, pages) {
            setContainer(itemHref, title, titleHref);
            var links = pages.map(function (page) {
                return page.all().map(function (link) {
                    return link.html.href;
                });
            }).reduce(function (prev, cur) {
                return prev.concat(cur);
            });
            return anatta.q.all(links.map(function (link) {
                return anatta.engine.link({href: link}).get();
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
