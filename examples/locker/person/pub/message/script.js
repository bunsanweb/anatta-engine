"use strict";

window.addEventListener("load", ev => {
    const text = document.getElementById("text");
    const refresh = document.getElementById("refresh");
    const message = document.getElementById("message");
    const agent = "/agent/";

    const request = (method, uri, data) => new Promise((f, r) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", f, false);
        req.open(method, uri, true);
        req.send(data);
    });
    
    const doRender = function (ev) {
        const doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = ev.target.responseText;
        const messageElem = doc.getElementById("message");
        message.textContent = messageElem ? messageElem.textContent : "";
    };

    const doLoad = function (ev) {
        const req = request("GET", agent, null);
        req.then(doRender);
    };

    
    const formData = function (elem) {
        const data = new FormData();
        data.append(elem.id, elem.value);
        return data;
    };

    refresh.addEventListener("click", ev => {
        const req = request("POST", agent, formData(text));
        req.then(doLoad);
        text.value = "";
    }, false);
    text.value = "";

    doLoad();
});
