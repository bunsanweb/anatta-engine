/*global anatta*/
"use strict";

window.addEventListener("agent-load", ev => {
    const container = document.querySelector("#statuses");
    const template = document.querySelector(".status");
    const orbURI = "/orb/";
    const postURI = "root:/orb/";
    const NUM = 5;

    const createStatus = (ev) => {
        const source = anatta.form.decode(ev.detail.request).source;
        if (!source) return null;
        const status = template.cloneNode(true);
        const date = new Date();
        const id = `status-${Math.round(date.getTime() / 10)}`;
        status.setAttribute("id", id);
        status.querySelector(".href").href = `${orbURI}${id}`;
        status.querySelector(".href").textContent = id;
        status.querySelector(".date").textContent = date;
        status.querySelector(".text").textContent = source;
        return status;
    };

    const formatUri = (uriObj, on, elem) => {
        const base = `${uriObj.protocol}//${uriObj.host}${uriObj.pathname}`;
        const id = elem ? elem.id : uriObj.query.id;
        const search = id ? `?on=${on}&id=${id}` : "";
        return `${base}${search}`;
    };

    const formatMessage = (statuses, uriObj) => {
        const doc = document.implementation.createHTMLDocument("statuses");
        const div = doc.createElement("div");
        statuses.forEach(
            status => div.appendChild(doc.importNode(status, true)));
        doc.body.appendChild(div);

        const refresh = doc.createElement("link");
        refresh.rel = "refresh";
        refresh.href = formatUri(uriObj, "refresh", div.firstChild);
        doc.head.appendChild(refresh);

        const backward = doc.createElement("link");
        backward.rel = "backward";
        backward.href = formatUri(uriObj, "backward", div.lastChild);
        doc.head.appendChild(backward);

        return doc;
    };

    const postStatus = (ev) => {
        const status = createStatus(ev);
        if (status) {
            container.insertBefore(status, container.firstChild);
            const statusDoc = formatMessage(
                [status], ev.detail.request.origin().location);
            anatta.engine.link({href: postURI + status.id}).put({
                headers: {"content-type": "text/html;charset=utf-8"},
                body: statusDoc.documentElement.outerHTML
            });
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
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
        const pivot = container.ownerDocument.getElementById(query.id);
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
