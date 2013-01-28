"use strict";

window.addEventListener("agent-load", function (ev) {
    var container = document.querySelector("#statuses");
    var template = document.querySelector(".status");
    var indexURI = "/agent/";
    var nextURI = "/agent/next/";
    var prevURI = "/agent/prev/";
    var orbURI = "/orb/";
    var NUM = 5;

    var createStatus = function (source) {
        var status = template.cloneNode(true);
        var date = new Date();
        var id = Math.round(date.getTime() / 10);
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

    var putStatus = function (status) {
        var linkRel = {
            index: indexURI,
            next: nextURI + status.id,
            prev: prevURI + status.id
        };
        var doc = createHTMLDoc(status.id, linkRel, status);
        var uri = "root:" + orbURI + status.id;
        anatta.engine.link({href: uri}).put({
            headers: {"content-type": "text/html;charset=utf-8"},
            body: doc.outerHTML
        });
    };

    var getLinkRel = function (div) {
        var linkRel = {index: indexURI};
        var first = div.firstChild;
        if (!!first) {
            var first_ = document.getElementById(first.id);
            if (!!first_ && !!first_.previousSibling) {
                linkRel["next"] = nextURI + first_.id;
            }
        }
        var last = div.lastChild;
        if (!!last) {
            var last_ = document.getElementById(last.id);
            if (last_ && !!last_.nextSibling) {
                linkRel["prev"] = prevURI + last_.id;
            }
        }
        return linkRel;
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
        var path = ev.detail.request.uriObject.path.split("/");
        var elem = document.getElementById(path[3]);
        var num = NUM;
        var idExist = !!elem;
        if (!idExist) {
            elem = container.firstChild;
            if (!!elem) {
                div.appendChild(elem.cloneNode(true));
                num -= 1;
            }
        }
        if (path[2] == "next" && idExist) {
            getNextStatuses(div, elem, num);
        }
        else {
            getPrevStatuses(div, elem, num);
        }
        return createHTMLDoc("statuses", getLinkRel(div), div).outerHTML;
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
