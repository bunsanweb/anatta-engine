/*global anatta*/
"use strict";

window.addEventListener("agent-load", ev => {
    const container = document.querySelector("#statuses");
    const statusTemplate = document.querySelector(".status");
    const infoTemplate = document.querySelector(".info");
    const url = anatta.builtin.url;
    const orbURI = "/orb/";
    const NUM = 5;

    const createStatusItem = (data) => {
        const status = statusTemplate.cloneNode(true);
        status.setAttribute("id", data.id);
        status.querySelector(".href").href = data.uri;
        status.querySelector(".href").textContent = data.id;
        status.querySelector(".date").textContent = data.date;
        return status;
    };
    
    const toReblog = (data) => {
        const status = createStatusItem(data);
        const content = status.querySelector(".content");
        const doc = content.ownerDocument;
        const form = data.form;

        const info = infoTemplate.cloneNode(true);
        info.querySelector(".author > .href").href = form.author;
        info.querySelector(".author > .href").textContent = form.author;
        const via = info.querySelector(".via");
        if (form.via) {
            via.querySelector(".href").href = form.via;
            via.querySelector(".href").textContent = form.via;
        } else {
            via.parentNode.removeChild(via);
        }
        content.appendChild(doc.importNode(info, true));

        const resource = data.origin.html.querySelector(form.selector);
        resource.id += `-${data.id}`;
        resource.className += " reblogged";
        content.appendChild(doc.importNode(resource, true));

        return status;
    };

    const toStatus = (data) => {
        const status = createStatusItem(data);
        status.querySelector(".text").textContent = data.form.source;
        return status;
    };

    const createItem = (data) => {
        const form = data.form;
        if (form.author && form.href && form.selector) {
            const link = anatta.engine.link({href: form.href});
            return link.get().then(entity => {
                const reblog = {
                    id: data.id, uri: data.uri, form,
                    date: data.date, origin: entity
                };
                return toReblog(reblog);
            });
        } else if (form.source) {
            return Promise.resolve(toStatus(data));
        }
        return Promise.resolve(null);
    };

    const createLink = (uriObj, rel, elem) => {
        const base = `${uriObj.protocol}//${uriObj.host}/`;
        const pathuri = url.resolve(base, uriObj.pathname);
        const id = elem ? elem.id : uriObj.query.id;
        const uri = url.resolve(pathuri, id ? `?on=${rel}&id=${id}` : "");
        
        const link = document.createElement("link");
        link.rel = rel;
        link.href = uri;
        return link;
    };

    const formatMessage = (statuses, uriObj) => {
        const doc = document.implementation.createHTMLDocument("statuses");
        const div = doc.createElement("div");
        statuses.forEach(
            status => div.appendChild(doc.importNode(status, true)));
        doc.body.appendChild(div);
        
        const refresh = createLink(uriObj, "refresh", div.firstChild);
        doc.head.appendChild(doc.importNode(refresh, true));

        const backward = createLink(uriObj, "backward", div.lastChild);
        doc.head.appendChild(doc.importNode(backward, true));

        return doc;
    };

    const putStatus = (uri, item, uriObj) => {
        container.insertBefore(item, container.firstChild);
        const itemDoc = formatMessage([item], uriObj);
        return anatta.engine.link({href: uri}).put({
            headers: {"content-type": "text/html;charset=utf-8"},
            body: itemDoc.documentElement.outerHTML
        });
    };

    const formatUri = (uriObj, id) => {
        const base = `${uriObj.protocol}//${uriObj.host}/`;
        const path = url.resolve(orbURI, id);
        return url.resolve(base, path);
    };

    const postStatus = (ev) => {
        const form = anatta.form.decode(ev.detail.request);
        const orgUriObj = ev.detail.request.origin().location;
        const date = new Date();
        const id = `status-${Math.round(date.getTime() / 10)}`;
        const uri = formatUri(orgUriObj, id);
        const data = {id, uri, form, date};
        createItem(data).then(
            item => item ? putStatus(uri, item, orgUriObj) : ""
        ).then(() => ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, ""));
    };

    const statusSlice = (pivot, max, getBack) => {
        const sibling = getBack ? "nextSibling" : "previousSibling";
        const slice = [];
        const append = getBack ? v => slice.push(v) : v => slice.unshift(v);
        for (let p = pivot, i = 0; p && i < max; p = p[sibling], i++) {
            append(p);
        }
        return slice;
    };

    const findStatuses = (query) => {
        const pivot =
                  query.id ? container.querySelector(`#${query.id}`) : null;
        switch (query.on) {
        case "refresh": {
            const updated = statusSlice(pivot, NUM + 1, false);
            return updated.slice(0, -1);
        }
        case "backward": {
            const past = statusSlice(pivot, NUM + 1, true);
            return past.slice(1);
        }
        default:
            return statusSlice(container.firstChild, NUM, true);
        }
    };
    
    const replyStatuses = (ev) => {
        const request = ev.detail.request;
        const statuses = findStatuses(request.location.query);
        const statusesDoc = formatMessage(statuses, request.origin().location);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, statusesDoc.documentElement.outerHTML);
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
        case "GET": return replyStatuses(ev);
        case "POST": return postStatus(ev);
        default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
