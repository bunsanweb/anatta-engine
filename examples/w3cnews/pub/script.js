"use strict";
window.addEventListener("load", ev => {
    const doRender = (ev) => {
        document.querySelector("#contents").innerHTML = ev.target.responseText;
    };
    const doLoad = (ev) => {
        const url = "/agent/";
        const req = new XMLHttpRequest();
        const render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };
    doLoad();
}, false);
