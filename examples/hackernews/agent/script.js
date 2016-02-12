"use strict";
window.addEventListener("agent-load", ev => {
    const containerTemplate = document.querySelector(".container");
    const contentTemplate = document.querySelector(".content");
    
    const rootUri = document.getElementById("rootUri");
    const root = anatta.engine.link(rootUri, "text/html", anatta.entity);

    //NOTE: customize termset in the agent
    anatta.engine.glossary.add(anatta.termset.desc.create({
        name: "hackernews",
        "content-type": "text/html",
        "uri-pattern": "^" + rootUri.href + "$",
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

    const linkToContent = (entity) => {
        const contentType = entity.response.headers["content-type"];
        const uri = entity.request.href;
        const titleText = contentType.startsWith("text/html") ?
                  entity.html.title || uri : uri;
        //console.log(titleText);
        const content = contentTemplate.cloneNode(true);
        content.querySelector(".href").href = uri;
        content.querySelector(".href").textContent = uri;
        content.querySelector(".title").textContent = titleText;
        return content;
    };

    const itemToContainer = (item) => {
        const container = containerTemplate.cloneNode(true);
        container.querySelector(".src").href = item.src;
        container.querySelector(".src").textContent = item.title;
        container.querySelector(".href").href = item.href;
        container.querySelector(".href").textContent = item.href;

        //console.log(item.links.map(l => l.href()));
        const contents = container.querySelector(".contents");
        return Promise.all(
            item.links.map(link => link.get().then(linkToContent))
        ).then(linkContents => {
            //console.log(linkContents);
            linkContents.forEach(contents.appendChild, contents);
            return container;
        }).catch(err => console.log(`${err} ${err.stack}`));
    };

    const getMore = function getMore(item) {
        if (!item.more) return item;
        const link = anatta.engine.link({href: item.more});
        return link.get().then(moreItem => ({
            href: item.href, title: item.title, src: item.src,
            links: item.links.concat(moreItem.all()),
            more: moreItem.attr("more")
        })).then(getMore);
    };
    
    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        root.get().then(
            rootEntity => rootEntity.all()[0].get()
        ).then(itemEntity => ({
            href: itemEntity.href(), title: itemEntity.attr("title"),
            src: itemEntity.attr("src"),
            links: itemEntity.all(), more: itemEntity.attr("more")
        })).then(getMore).then(itemToContainer).then(
            container => ev.detail.respond(200, {
                "content-type": "text/html;charset=utf-8"
            }, container.innerHTML)
        );
    }, false);
}, false);
