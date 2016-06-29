"use strict";
window.addEventListener("load", ev => {
    const source = document.querySelector("#source");
    
    const doRender = (ev) => {
        const plain = +ev.target.status === 200 ? ev.target.responseText : "";
        document.querySelector("#content").innerHTML = plain;
        source.value = document.getElementById("text").textContent;
    };

    const doLoad = (ev) => {
        const url = "/wall/";
        const req = new XMLHttpRequest();
        req.addEventListener("load", doRender, false);
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
