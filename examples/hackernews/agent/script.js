"use strict";
window.addEventListener("agent-load", function (ev) {
    var rootUri = document.getElementById("rootUri");
    var root = anatta.engine.link(rootUri, "text/html", anatta.entity);
    var containerTemplate = document.querySelector(".container");
    var contentTemplate = document.querySelector(".content");
    anatta.engine.glossary.add(anatta.termset.desc.create({
        name: "hackernews",
        "content-type": "text/html",
        "uri-pattern": "^" + rootUri.href + "*",
        entity: {
            link: {selector: "a[href^='item?id']", value: "href"},
        }
    }));
    anatta.engine.glossary.add(anatta.termset.desc.create({
        name: "hackernews-item",
        "content-type": "text/html",
        "uri-pattern": "^" + rootUri.href + "item*",
        entity: {
            title: {selector: ".title > a", value: "textContent"},
            src: {selector: ".title > a", value: "href"},
            more: {selector: "a[href^='/x?fnid']", value: "href"},
            link: {selector: "a[href^='http'][rel='nofollow']"}
        }
    }));

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

    var itemToContainer = function (item) {
        var container = containerTemplate.cloneNode(true);
        container.querySelector(".src").href = item.src;
        container.querySelector(".src").textContent = item.title;
        container.querySelector(".href").href = item.href;
        container.querySelector(".href").textContent = item.href;

        var contents = container.querySelector(".contents");
        return anatta.q.all(item.links.map(function (link) {
            return link.get();
        })).then(function (linkEntities) {
            linkEntities.forEach(function (linkEntity) {
                contents.appendChild(createContent(linkEntity));
            });
            return container;
        });
    };

    var getMore = function (item) {
        if (!item.more) return item;
        var link = anatta.engine.link({href: item.more});
        return link.get().then(function (moreItem) {
            return {href: item.href, title: item.title, src: item.src,
                    links: item.links.concat(moreItem.all()),
                    more: moreItem.attr("more")}
        }).then(getMore);
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        root.get().then(function (rootEntity) {
            return rootEntity.all()[0].get();
        }).then(function (itemEntity) {
            return {href: itemEntity.href(), title: itemEntity.attr("title"),
                    src: itemEntity.attr("src"),
                    links: itemEntity.all(), more: itemEntity.attr("more")};
        }).then(getMore).then(itemToContainer).then(function (container) {
            ev.detail.respond(200, {
                "content-type": "text/html;charset=utf-8"
            }, container.innerHTML);
        });
    }, false);
}, false);
