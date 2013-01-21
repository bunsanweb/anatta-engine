"use strict";
window.addEventListener("load", function (ev) {
    var doRender = function (ev) {
        document.querySelector("#contents").innerHTML = this.responseText;
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
