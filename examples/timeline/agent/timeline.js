"use strict";

window.addEventListener("agent-load", ev => {
    const followingTemplate = document.querySelector(".following");
    const fromTemplate = document.querySelector(".from");
    const reblogButtonTemplate = document.querySelector(".reblog");
    const followings = document.querySelector("#followings");
    const container = document.querySelector("#statuses");
    const url = anatta.builtin.url;
    const statusesPath = "/statuses/", NUM = 5;
    const streamers = {}, waits = {continued: 500, interval: 5000};

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
        doc.body.appendChild(doc.importNode(followings, true));
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
        //console.log(statusesDoc.documentElement.outerHTML);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, statusesDoc.documentElement.outerHTML);
    };

    const formatStatus = function (uri, entry) {
        const parsed = url.parse(uri);
        const href = `${parsed.protocol}//${parsed.host}/`;
        const from = fromTemplate.cloneNode(true);
        from.querySelector(".href").href = href;
        from.querySelector(".href").textContent = href;
        entry.appendChild(from);
        entry.appendChild(reblogButtonTemplate.cloneNode(true));
        return entry;
    };

    const insertStatus = (status) => {
        let elem = container.firstChild;
        while (elem && elem.id > status.id) elem = elem.nextSibling;
        container.insertBefore(status, elem);
    };

    const setStreamer = (followerUri) => {
        const uri = url.resolve(followerUri, statusesPath);
        const streamer = Streamer(
            uri, entry => container.ownerDocument.importNode(entry, true));
        streamer.on("insert", entry =>
                    insertStatus(formatStatus(streamer.uri, entry)));
        streamer.on("refresh", updated => setTimeout(
            () => streamer.refresh(),
            updated ? waits.continued : waits.interval));
        streamers[followerUri] = streamer;
    };

    const setFollowing = (followerUri) => {
        const following = followingTemplate.cloneNode(true);
        following.querySelector(".href").href = followerUri;
        following.querySelector(".href").textContent = followerUri;
        const doc = followings.ownerDocument;
        followings.appendChild(doc.importNode(following, true));
    };

    const refreshContainer = () => {
        container.innerHTML = "";
        Object.keys(streamers).forEach((uri) => {
            streamers[uri].load();
        });
    };

    const postFollower = function (ev) {
        const followerUri = anatta.form.decode(ev.detail.request).follower;
        if (followerUri && !streamers[followerUri]) {
            setStreamer(followerUri);
            setFollowing(followerUri);
            refreshContainer();
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        switch (ev.detail.request.method) {
        case "GET": return replyStatuses(ev);
        case "POST": return postFollower(ev);
        default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
