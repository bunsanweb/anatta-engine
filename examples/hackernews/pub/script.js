"use strict";
window.addEventListener("load", ev => {
    const doRender = function (ev) {
        document.querySelector("#container").innerHTML = this.responseText;
    };
    const doLoad = function (ev) {
        const url = "/agent/";
        const req = new XMLHttpRequest();
        const render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };
    doLoad();
}, false);
