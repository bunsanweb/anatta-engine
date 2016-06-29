"use strict";

window.addEventListener("load", ev => {
    const instUri = document.getElementById("instUri");
    const insts = document.getElementById("insts");
    const add = document.getElementById("add");
    const agent = document.querySelector("link[rel='agent']").href;

    const request = (method, uri, data) => new Promise((f, r) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", f, false);
        req.open(method, uri, true);
        req.send(data);
    });

    const formData = function (elem) {
        const data = new FormData();
        data.append(elem.id, elem.value);
        return data;
    };

    const doRender = (ev) => {
        const doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = ev.target.responseText;
        const instsElem = doc.getElementById("insts");
        insts.innerHTML = instsElem ? instsElem.innerHTML : "";
    };

    const doLoad = (ev) => {
        const req = request("GET", agent, null);
        req.then(doRender);
    };

    add.addEventListener("click", ev => {
        const req = request("POST", agent, formData(instUri));
        req.then(doLoad);
        instUri.value = "";
    }, false);
    instUri.value = "";

    doLoad();
});
