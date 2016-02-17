"use strict";

window.addEventListener("load", ev => {
    const agent = document.querySelector("link[rel='agent']").href;
    const upload = document.getElementById("upload");
    const fileInput = () => document.getElementById("fileinput");
    
    const doRender = (ev) => {
        document.getElementById("files").outerHTML = ev.target.responseText;
        fileInput().outerHTML = fileInput().outerHTML; // clear selection
    };

    const doLoad = (ev) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", doRender, false);
        req.open("GET", agent, true);
        req.send();
    };

    const doUpload = (ev) => {
        const data = new FormData();
        Array.from(fileInput().files).forEach(
            file => data.append("file", file));
        const req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("POST", agent, true);
        req.send(data);
    };

    upload.addEventListener("click", doUpload, false);
    doLoad();
}, false);
