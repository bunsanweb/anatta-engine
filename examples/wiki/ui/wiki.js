"use strict";
window.addEventListener("load", ev => {
    const title = document.getElementById("title");
    const heading = document.getElementById("heading");
    const content = document.getElementById("content");
    const source = document.getElementById("source");
    const update = document.getElementById("update");
    
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
        const url = `/orb/${name}`;
        const req = new XMLHttpRequest();
        const renderer = doRender.bind(req);
        req.addEventListener("load", renderer, false);
        req.addEventListener("error", renderer, false);
        req.open("GET", url, true);
        req.send();
    };
    const doRender = function (ev) {
        var plain = this.status === 200 ? this.responseText : "";
        title.textContent = heading.textContent = name;
        content.innerHTML = plain.replace(wikiName, linker);
        source.value = plain;
    };
    const wikiName = /\[\[([^\]]+)\]\]/g;
    const linker = (match, name) => {
        return `<a href='#${name}'>${name}</a>`;
    };
    
    const doUpdate = (ev) => {
        var name = location.hash.substring(1);
        var url = `/orb/${name}`;
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("PUT", url, true);
        req.setRequestHeader("content-type", "text/plain;charset=UTF-8");
        req.send(source.value);
    };
    
    init();
}, false);
