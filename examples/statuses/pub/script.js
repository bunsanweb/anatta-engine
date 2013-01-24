"use strict";

var Streamer = function (uris) {
    return Object.create(Streamer.prototype, {
        current: {value: uris.current || "/agent/"},
        next: {value: uris.next || "/agent/next/"},
        prev: {value: uris.prev || "/agent/prev/"},
        callbacks: {value: {}}
    });
};

Streamer.prototype.on = function (event, callback) {
    this.callbacks[event] = callback;
};

Streamer.prototype.load = function (uri, callback) {
    var obj = this;
    var render = function (ev) {
        var div = document.createElement("div");
        div.innerHTML = this.responseText;
        var statuses = div.querySelectorAll(".status");
        callback(statuses);

        statuses = document.querySelectorAll("#statuses > .status");
        var head = statuses[0];
        if (head) streamer.head = head.querySelector(".id").textContent;
        var tail = statuses[statuses.length - 1];
        if (tail) streamer.tail = tail.querySelector(".id").textContent;
    };
    var req = new XMLHttpRequest();
    req.addEventListener("load", render.bind(req), false);
    req.open("GET", uri, true);
    req.send();
};

Streamer.prototype.init = function () {
    var obj = this;
    return function (ev) {
        var update = function () {
            var uri = obj.next + obj.head;
            obj.load(uri, obj.callbacks["next"]);
            setTimeout(update, 5000)
        };
        update();

        var prevButton = document.querySelector("#prev");
        prevButton.addEventListener("click", function (ev) {
            var uri = obj.prev + obj.tail;
            obj.load(uri, obj.callbacks["prev"]);
        }, false);

        var source = document.querySelector("#source");
        var postButton = document.querySelector("#post");
        postButton.addEventListener("click", function (ev) {
            var req = new XMLHttpRequest();
            req.addEventListener("load", update, false);
            req.open("PUT", obj.current, true);
            var data = new FormData();
            data.append("source", source.value);
            req.send(data);
            source.value = "";
        }, false);
        source.value = "";
    }
};

var streamer = Streamer({
    current: "/agent/",
    next: "/agent/next/",
    prev: "/agent/prev/"
});

streamer.on("next", function (statuses) {
    var container = document.querySelector("#statuses");
    var fst = container.firstChild;
    Array.prototype.forEach.call(statuses, function (st) {
        !!fst ? container.insertBefore(st, fst) : container.appendChild(st);
    });
});

streamer.on("prev", function (statuses) {
    var container = document.querySelector("#statuses");
    Array.prototype.forEach.call(statuses, function (st) {
        container.appendChild(st);
    });
});

window.addEventListener("load", streamer.init(), false);
