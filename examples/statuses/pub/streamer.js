"use strict";

var Streamer = function (updateRate) {
    return Object.create(Streamer.prototype, {
        updateRate: {value: updateRate || 10, writable: true},
        next: {value: "", writable: true},
        prev: {value: "", writable: true},
        callbacks: {value: {}}
    });
};

Streamer.prototype.get = function (uri, callback) {
    var render = function (ev) {
        var doc = document.createElement("html");
        doc.innerHTML = this.responseText;
        callback(doc);
    };
    var req = new XMLHttpRequest();
    req.addEventListener("load", render.bind(req), false);
    req.open("GET", uri, true);
    req.send();
};

Streamer.prototype.post = function (uri, source, load) {
    var req = new XMLHttpRequest();
    req.addEventListener("load", load, false);
    req.open("POST", uri, true);
    var data = new FormData();
    data.append("source", source);
    req.send(data);
};

Streamer.prototype.on = function (event, callback) {
    this.callbacks[event] = callback;
};

Streamer.prototype.dispatch = function (event) {
    return this.callbacks[event]();
};
