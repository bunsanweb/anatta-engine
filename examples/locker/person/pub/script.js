"use strict";

window.addEventListener("load", ev => {
    const registered = document.getElementById("registered");
    const house = document.getElementById("house");
    const register = document.getElementById("register");
    const pem = document.getElementById("pem");
    const pubkeys = document.getElementById("pubkeys");
    const add = document.getElementById("add");
    const agent = "/agent/";

    const doRender = (ev) => {
        const doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = ev.target.responseText;
        const houseElem = doc.querySelector("link[rel='house']");
        registered.textContent = houseElem ? houseElem.href : "";
        const pubkeysElem = doc.getElementById("pubkeys");
        pubkeys.innerHTML = pubkeysElem ? pubkeysElem.innerHTML : "";
    };

    const request = (method, uri, data) => new Promise((f, r) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", f, false);
        req.open(method, uri, true);
        req.send(data);
    });
    
    const doLoad = (ev) => {
        const req = request("GET", agent, null);
        req.then(doRender);
    };

    const formData = (elem) => {
        const data = new FormData();
        data.append(elem.id, elem.value);
        return data;
    };

    register.addEventListener("click", ev => {
        const req = request("POST", agent, formData(house));
        req.then(doLoad);
        house.value = "";
    }, false);
    house.value = "";

    add.addEventListener("click", ev => {
        const req = request("POST", agent, formData(pem));
        req.then(doLoad);
        pem.value = "";
    }, false);
    pem.value = "";

    doLoad();
});
