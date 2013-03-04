"use strict";
window.addEventListener("load", function (ev) {
    var source = document.querySelector("#source");
    var agent = document.querySelector("link[rel='agent']").href;

    var doRender = function (ev) {
        var plain = this.status == 200 ? this.responseText : "";
        document.querySelector("#content").innerHTML = plain;
        source.value = document.getElementById("text").textContent;
    };

    var doLoad = function (ev) {
        var req = new XMLHttpRequest();
        var render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", agent, true);
        req.send();
    };

    var doUpdate = function (ev) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("PUT", agent, true);
        var data = new FormData();
        data.append("source", source.value);
        req.send(data);
    };
    document.querySelector("#update").addEventListener("click", doUpdate, false);
    doLoad();
}, false);
