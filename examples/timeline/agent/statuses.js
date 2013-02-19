"use strict";

window.addEventListener("agent-load", function (ev) {
    var container = document.querySelector("#statuses");
    var statusTemplate = document.querySelector(".status");
    var infoTemplate = document.querySelector(".info");
    var url = anatta.builtin.url;
    var orbURI = "/orb/";
    var postURI = "root:/orb/";
    var NUM = 5;

    var createStatusItem = function (data) {
        var status = statusTemplate.cloneNode(true);
        status.setAttribute("id", data.id);
        status.querySelector(".href").href = data.uri;
        status.querySelector(".href").textContent = data.id;
        status.querySelector(".date").textContent = data.date;
        return status;
    };

    var toReblog = function (data) {
        var status = createStatusItem(data);
        var content = status.querySelector(".content");
        var doc = content.ownerDocument;
        var form = data.form;

        var info = infoTemplate.cloneNode(true);
        info.querySelector(".author > .href").href = form.author;
        info.querySelector(".author > .href").textContent = form.author;
        var via = info.querySelector(".via");
        if (form.via) {
            via.querySelector(".href").href = form.via;
            via.querySelector(".href").textContent = form.via;
        } else {
            via.parentNode.removeChild(via);
        }
        content.appendChild(doc.importNode(info, true));

        var resource = data.origin.html.querySelector(form.selector);
        resource.id += "-" + data.id;
        resource.className += " reblogged";
        content.appendChild(doc.importNode(resource, true));

        return status;
    };

    var toStatus = function (data) {
        var status = createStatusItem(data);
        status.querySelector(".text").textContent = data.form.source;
        return status;
    };

    var createItem = function (data) {
        var form = data.form;
        if (form.author && form.href && form.selector) {
            var link = anatta.engine.link({href: form.href});
            return link.get().then(function (entity) {
                var reblog = {
                    id: data.id, uri: data.uri, form: form,
                    date: data.date, origin: entity
                };
                return toReblog(reblog);
            });
        } else if (form.source) {
            return anatta.q.resolve(toStatus(data));
        }
    };

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

    var putStatus = function (uri, item, uriObj) {
        container.insertBefore(item, container.firstChild);
        return anatta.engine.link({href: uri}).put({
            headers: {"content-type": "text/html;charset=utf-8"},
            body: formatMessage([item], uriObj).outerHTML
        });
    };

    var formatUri = function (uriObj, id) {
        var base = uriObj.protocol + "//" + uriObj.host + "/";
        var path = url.resolve(orbURI, id);
        return url.resolve(base, path);
    };

    var postStatus = function (ev) {
        var form = anatta.form.decode(ev.detail.request);
        var orgUriObj = ev.detail.request.origin().uriObject;
        var date = new Date();
        var id = "status-" + Math.round(date.getTime() / 10);
        var uri = formatUri(orgUriObj, id);
        var data = {id: id, uri: uri, form: form, date: date};
        createItem(data).then(function (item) {
            return item ? putStatus(uri, item, orgUriObj) : "";
        }).then(function () {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, "");
        });
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
        var statuses = findStatuses(request.uriObject.query);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, formatMessage(statuses, request.origin().uriObject).outerHTML);
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
