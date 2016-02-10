"use strict";
window.addEventListener("load", ev => {
    const source = document.querySelector("#source");
    
    const doRender = function (ev) {
        var plain = this.status == 200 ? this.responseText : "";
        document.querySelector("#content").innerHTML = plain;
        source.value = document.getElementById("text").textContent;
    };

    const doLoad = (ev) => {
        var url = "/wall/";
        var req = new XMLHttpRequest();
        var render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };

    const doUpdate = function (ev) {
        const url = "/wall/";
        const req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("PUT", url, true);
        const data = new FormData();
        data.append("source", source.value);
        req.send(data);
    };
    document.querySelector("#update").addEventListener(
        "click", doUpdate, false);
    doLoad();
}, false);
