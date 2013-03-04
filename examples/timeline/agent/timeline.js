"use strict";

window.addEventListener("agent-load", function (ev) {
    var followings = document.querySelector("#followings");
    var followingTemplate = document.querySelector(".following");
    var fromTemplate = document.querySelector(".from");
    var reblogButtonTemplate = document.querySelector(".reblog");
    var container = document.querySelector("#statuses");
    var statusesPath = "/statuses/";
    var streamers = {};
    var url = anatta.builtin.url;
    var waits = {continued: 500, interval: 5000};
    var NUM = 5;

    var createLink = function (uriObj, rel, elem) {
        var uri = uriObj.protocol + "//" + uriObj.host + "/";
        uri = url.resolve(uri, uriObj.pathname);
        var id = elem ? elem.id : uriObj.query.id;
        uri = url.resolve(uri, id ? "?on=" + rel + "&id=" + id : "");

        var link = document.createElement("link");
        link.rel = rel;
        link.href = uri;

        return link;
    };

    var formatMessage = function (statuses, uriObj) {
        var doc = document.implementation.createHTMLDocument("statuses");
        doc.body.appendChild(doc.importNode(followings, true));
        var div = doc.createElement("div");
        statuses.forEach(function (status) {
            div.appendChild(doc.importNode(status, true));
        });
        doc.body.appendChild(div);

        var refresh = createLink(uriObj, "refresh", div.firstChild);
        doc.head.appendChild(doc.importNode(refresh, true));

        var backward = createLink(uriObj, "backward", div.lastChild);
        doc.head.appendChild(doc.importNode(backward, true));

        return doc;
    };

    var statusSlice = function (pivot, max, getBack) {
        var sibling = getBack ? "nextSibling" : "previousSibling";
        var append = getBack ? "push" : "unshift";
        var slice = [];
        for (var i = 0; pivot && i < max; i++) {
            slice[append](pivot);
            pivot = pivot[sibling];
        }
        return slice;
    };

    var findStatuses = function (query) {
        var pivot = query.id ? container.querySelector("#" + query.id) : null;
        switch (query.on) {
            case "refresh":
                var slice = statusSlice(pivot, NUM+1, false);
                return slice.slice(0, slice.length-1);
            case "backward":
                var slice = statusSlice(pivot, NUM+1, true);
                return slice.slice(1);
            default:
                return statusSlice(container.firstChild, NUM, true);
        }
    };

    var replyStatuses = function (ev) {
        var request = ev.detail.request;
        var statuses = findStatuses(request.location.query);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, formatMessage(statuses, request.origin().location).outerHTML);
    };

    var formatStatus = function (uri, entry) {
        var parsed = url.parse(uri);
        var href = parsed.protocol + "//" + parsed.host + "/";
        var from = fromTemplate.cloneNode(true);
        from.querySelector(".href").href = href;
        from.querySelector(".href").textContent = href;
        entry.appendChild(from);
        entry.appendChild(reblogButtonTemplate.cloneNode(true));
        return entry;
    };

    var insertStatus = function (status) {
        var elem = container.firstChild;
        while (elem && elem.id > status.id) {
            elem = elem.nextSibling;
        }
        container.insertBefore(status, elem);
    };

    var setStreamer = function (followerUri) {
        var uri = url.resolve(followerUri, statusesPath);
        var streamer = Streamer(uri, function (entry) {
            return container.ownerDocument.importNode(entry, true);
        });
        streamer.on("insert", function (entry) {
            var status = formatStatus(this.uri, entry);
            insertStatus(status);
        });
        streamer.on("refresh", function (updated) {
            return setTimeout(streamer.get("refresh"),
                updated ? waits.continued : waits.interval);
        });
        streamers[followerUri] = streamer;
    };

    var setFollowing = function (followerUri) {
        var following = followingTemplate.cloneNode(true);
        following.querySelector(".href").href = followerUri;
        following.querySelector(".href").textContent = followerUri;
        var doc = followings.ownerDocument;
        followings.appendChild(doc.importNode(following, true));
    };

    var refreshContainer = function () {
        container.innerHTML = "";
        Object.keys(streamers).forEach(function (key) {
            streamers[key].get("load")();
        });
    };

    var postFollower = function (ev) {
        var followerUri = anatta.form.decode(ev.detail.request).follower;
        if (followerUri && !streamers[followerUri]) {
            setStreamer(followerUri);
            setFollowing(followerUri);
            refreshContainer();
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return replyStatuses(ev);
            case "POST": return postFollower(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
