"use strict";
window.addEventListener("load", function (ev) {
    var doRender = function (ev) {
        var plain = this.status == 200 ? this.responseText : "";
        document.querySelector("#contents").innerHTML = plain;
    };
    var doLoad = function (ev) {
        var url = "/agent/";
        var req = new XMLHttpRequest();
        var render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };
    doLoad();
}, false);
