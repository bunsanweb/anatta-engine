"use strict";

window.addEventListener("agent-load", function (ev) {
    var container = document.querySelector("#statuses");
    var template = document.querySelector(".status");
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

    var formatUri = function (uriObj, on, elem) {
        var base = uriObj.protocol + "//" + uriObj.host + uriObj.pathname;
        var id = elem ? elem.id : uriObj.query.id;
        var search = id ? "?on=" + on + "&id=" + id : "";
        return base + search;
    };

    var formatMessage = function (statuses, uriObj) {
        var doc = document.implementation.createHTMLDocument("statuses");
        var div = doc.createElement("div");
        statuses.forEach(function (status) {
            div.appendChild(doc.importNode(status, true));
        });
        doc.body.appendChild(div);

        var refresh = doc.createElement("link");
        refresh.rel = "refresh";
        refresh.href = formatUri(uriObj, "refresh", div.firstChild);
        doc.head.appendChild(refresh);

        var backward = doc.createElement("link");
        backward.rel = "backward";
        backward.href = formatUri(uriObj, "backward", div.lastChild);
        doc.head.appendChild(backward);

        return doc;
    };

    var postStatus = function (ev) {
        var status = createStatus(ev);
        if (status) {
            container.insertBefore(status, container.firstChild);
            var statusDoc = formatMessage(
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
        var statusesDoc = formatMessage(statuses, request.origin().location);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, statusesDoc.documentElement.outerHTML);
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
