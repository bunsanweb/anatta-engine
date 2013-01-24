"use strict";
window.addEventListener("agent-load", function (ev) {
    var container = document.querySelector("#statuses");
    var template = document.querySelector(".status");
    var orbURI = "/orb/";
    var NUM = 5;

    var createStatus = function (source) {
        var status = template.cloneNode(true);
        var date = new Date();
        var id = Math.round(date.getTime() / 1000);
        status.querySelector(".href").href = orbURI + id;
        status.querySelector(".href").textContent = id;
        status.querySelector(".date").textContent = date;
        status.querySelector(".text").textContent = source;
        return status;
    };

    var addStatus = function (status) {
        var first = container.firstChild;
        if (!!first) {
            container.insertBefore(status, first);
        }
        else {
            container.appendChild(status);
        }
    };

    var putStatus = function (status) {
        var id = status.querySelector(".id").textContent;
        var uri = "root:" + orbURI + id;
        var message = {
            headers: {"content-type": "text/html;charset=utf-8"},
            body: status.outerHTML
        };
        anatta.engine.link({href: uri}).put(message);
    };

    var getStatuses = function (id, cmp) {
        var div = document.createElement("div");
        var statuses = container.querySelectorAll(".status");
        var added = 0;
        if (!!statuses) {
            Array.prototype.forEach.call(statuses, function (status) {
                var id_ = parseInt(status.querySelector(".id").textContent);
                if (cmp(id, id_) && added < NUM) {
                    div.appendChild(status.cloneNode(true));
                    added += 1;
                }
            });
        }
        return div.innerHTML;
    };

    var respond = function (ev) {
        var path = ev.detail.request.uriObject.path.split("/");
        var id = parseInt(path[3]) || 0;
        var cmp = function (a, b) {return true};
        if (path[2] == "next") cmp = function (a, b) {return a < b};
        if (path[2] == "prev") cmp = function (a, b) {return a > b};
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, getStatuses(id, cmp));
    };

    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        if (ev.detail.request.method == "PUT") {
            var source = anatta.form.decode(ev.detail.request).source;
            if (!!source) {
                var status = createStatus(source);
                addStatus(status);
                putStatus(status);
            }
        }
        respond(ev);
    }, false);
}, false);
