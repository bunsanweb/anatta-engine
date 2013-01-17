"use strict";
window.addEventListener("load", function (ev) {
    var source = document.querySelector("#source");

    var doRender = function (ev) {
        var plain = this.status == 200 ? this.responseText : "";
        document.querySelector("#content").innerHTML = plain;
        source.value = document.getElementById("text").textContent;
    };

    var doLoad = function (ev) {
        var url = "/wall/";
        var req = new XMLHttpRequest();
        var render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };

    var doUpdate = function (ev) {
        var url = "/wall/";
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("PUT", url, true);
        var data = new FormData();
        data.append("source", source.value);
        req.send(data);
    };
    document.querySelector("#update").addEventListener("click", doUpdate, false);
    doLoad();
}, false);
