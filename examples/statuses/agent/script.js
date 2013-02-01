"use strict";

window.addEventListener("agent-load", function (ev) {
    var container = document.querySelector("#statuses");
    var template = document.querySelector(".status");
    var indexURI = "/stream/";
    var refreshURI = "/stream/?on=refresh&id=";
    var backwardURI = "/stream/?on=backward&id=";
    var orbURI = "/orb/";
    var postURI = "root:/orb/";
    var NUM = 5;

    var createStatus = function (ev) {
        var source = anatta.form.decode(ev.detail.request).source;
        if (!source) return "";
        var status = template.cloneNode(true);
        var date = new Date();
        var id = "status-" + Math.round(date.getTime() / 10);
        status.setAttribute("id", id);
        status.querySelector(".href").href = orbURI + id;
        status.querySelector(".href").textContent = id;
        status.querySelector(".date").textContent = date;
        status.querySelector(".text").textContent = source;
        return status;
    };

    var formatMessage = function (statuses, uri) {
        var doc = document.implementation.createHTMLDocument("statuses");
        var div = doc.createElement("div");
        statuses.forEach(function (status) {
            div.appendChild(doc.importNode(status, true));
        });
        doc.body.appendChild(div);

        var refresh = doc.createElement("link");
        refresh.rel = "refresh";
        refresh.href = div.firstChild ? refreshURI + div.firstChild.id : uri;
        doc.head.appendChild(refresh);

        var backward = doc.createElement("link");
        backward.rel = "backward";
        backward.href = div.lastChild ? backwardURI + div.lastChild.id : uri;
        doc.head.appendChild(backward);

        return doc;
    };

    var postStatus = function (ev) {
        var status = createStatus(ev);
        if (status) {
            container.insertBefore(status, container.firstChild);
            anatta.engine.link({href: postURI + status.id}).put({
                headers: {"content-type": "text/html;charset=utf-8"},
                body: formatMessage([status], orbURI).outerHTML
            });
        }
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, "");
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
        var pivot = container.ownerDocument.getElementById(query.id);
        switch (query.on) {
            case "refresh":
                var slice = statusSlice(pivot, NUM+1, false);
                return slice.slice(0, NUM);
            case "backward":
                var slice = statusSlice(pivot, NUM+1, true);
                return slice.slice(1);
            default:
                return statusSlice(container.firstChild, NUM, true);
        }
    };

    var replyStatuses = function (ev) {
        var request = ev.detail.request;
        var statuses = findStatuses(request.uriObject.query);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, formatMessage(statuses, indexURI).outerHTML);
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        switch (ev.detail.request.method) {
            case "GET": return replyStatuses(ev);
            case "POST": return postStatus(ev);
            default: return ev.detail.respond("405", {allow: "GET,POST"}, "");
        }
    }, false);
}, false);
