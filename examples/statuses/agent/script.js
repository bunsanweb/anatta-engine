"use strict";

window.addEventListener("agent-load", function (ev) {
    var container = document.querySelector("#statuses");
    var template = document.querySelector(".status");
    var indexURI = "/stream/";
    var refreshURI = "/stream/?on=refresh&id=";
    var backwardURI = "/stream/?on=backward&id=";
    var orbURI = "/orb/";
    var NUM = 5;

    var createStatus = function (source) {
        var status = template.cloneNode(true);
        var date = new Date();
        var sec = Math.round(date.getTime() / 10);
        var id = "status-" + sec;
        status.setAttribute("id", id);
        status.querySelector(".href").href = orbURI + id;
        status.querySelector(".href").textContent = id;
        status.querySelector(".date").textContent = date;
        status.querySelector(".text").textContent = source;
        return status;
    };

    var createHTMLDoc = function (title, linkRel, elem) {
        var doc = document.implementation.createHTMLDocument(title);
        for (var rel in linkRel) {
            var link = doc.createElement("link");
            link.setAttribute("rel", rel);
            link.setAttribute("href", linkRel[rel]);
            doc.head.appendChild(link);
        }
        doc.body.appendChild(doc.importNode(elem, true));
        return doc;
    };

    var getLinkRel = function (first, last) {
        return {
            index: indexURI,
            refresh: refreshURI + (first ? first.id : ""),
            backward: backwardURI + (last ? last.id : "")
        };
    };

    var putStatus = function (status) {
        var linkRel = getLinkRel(status, status);
        var doc = createHTMLDoc(status.id, linkRel, status);
        var uri = "root:" + orbURI + status.id;
        anatta.engine.link({href: uri}).put({
            headers: {"content-type": "text/html;charset=utf-8"},
            body: doc.outerHTML
        });
    };

    var getNextStatuses = function (div, elem, num) {
        while (!!elem && 0 < num--) {
            var sib = elem.previousSibling;
            if (!!sib) div.insertBefore(sib.cloneNode(true), div.firstChild);
            elem = sib;
        }
    };

    var getPrevStatuses = function (div, elem, num) {
        while (!!elem && 0 < num--) {
            var sib = elem.nextSibling;
            if (!!sib) div.appendChild(sib.cloneNode(true));
            elem = sib;
        }
    };

    var getStatuses = function (ev) {
        var div = document.createElement("div");
        var query = ev.detail.request.uriObject.query;
        var elem = document.getElementById(query.id);
        var num = NUM;
        var idExist = !!elem;
        if (!idExist) {
            elem = container.firstChild;
            if (!!elem) {
                div.appendChild(elem.cloneNode(true));
                num -= 1;
            }
        }
        if (query.on == "refresh" && idExist) {
            getNextStatuses(div, elem, num);
        }
        else {
            getPrevStatuses(div, elem, num);
        }
        var first = div.firstChild || elem;
        var last = div.lastChild || elem;
        var linkRel = getLinkRel(first, last);
        return createHTMLDoc("statuses", linkRel, div).outerHTML;
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        var responseText = "";
        if (ev.detail.request.method == "POST") {
            var source = anatta.form.decode(ev.detail.request).source;
            if (!!source) {
                var status = createStatus(source);
                container.insertBefore(status, container.firstChild);
                putStatus(status);
            }
        }

        if (ev.detail.request.method == "GET") responseText = getStatuses(ev);

        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, responseText);
    }, false);
}, false);
