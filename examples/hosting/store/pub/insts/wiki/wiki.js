"use strict";
window.addEventListener("load", ev => {
    const title = document.getElementById("title");
    const heading = document.getElementById("heading");
    const content = document.getElementById("content");
    const source = document.getElementById("source");
    const update = document.getElementById("update");
    const orb = document.querySelector("link[rel='orb']").href;

    const wikiName = /\[\[([^\]]+)]]/g;
    const linker = (match, name) => `<a href='#${name}'>${name}</a>`;
    
    const init = () => {
        window.addEventListener("hashchange", doLoad, false);
        update.addEventListener("click", doUpdate, false);
        if (!window.location.hash) {
            window.location.hash = "FrontPage";
        } else {
            doLoad();
        }
    };
    
    const doLoad = (ev) => {
        const name = location.hash.substring(1);
        const url = `${orb}/${name}`;
        const req = new XMLHttpRequest();
        req.addEventListener("load", doRender, false);
        req.addEventListener("error", doRender, false);
        req.open("GET", url, true);
        req.send();
    };
    const doRender = (ev) => {
        const name = location.hash.substring(1);
        const plain = ev.target.status === 200 ? ev.target.responseText : "";
        title.textContent = heading.textContent = decodeURIComponent(name);
        content.innerHTML = plain.replace(wikiName, linker);
        source.value = plain;
    };
    
    const doUpdate = (ev) => {
        const name = location.hash.substring(1);
        const url = `${orb}/${name}`;
        const req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("PUT", url, true);
        req.setRequestHeader("content-type", "text/plain;charset=UTF-8");
        req.send(source.value);
    };
    
    init();
}, false);
