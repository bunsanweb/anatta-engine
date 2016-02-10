"use strict";
window.addEventListener("load", ev => {
    const url = "/files/";
    const upload = document.getElementById("upload");
    const fileInput = () => document.getElementById("fileinput");

    const doRender = function (ev) {
        document.getElementById("files").outerHTML = this.responseText;
        fileInput().outerHTML = fileInput().outerHTML; // clear selection
    };

    const doLoad = (ev) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", doRender.bind(req), false);
        req.open("GET", url, true);
        req.send();
    };

    const doUpload = (ev) => {
        const data = new FormData();
        Array.from(fileInput().files).forEach(
            file => data.append("file", file));
        const req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("POST", url, true);
        req.send(data);
    };

    upload.addEventListener("click", doUpload, false);
    doLoad();
}, false);
