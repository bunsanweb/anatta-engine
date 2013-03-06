"use strict";
window.addEventListener("load", function (ev) {
    var agent = document.querySelector("link[rel='agent']").href;
    var upload = document.getElementById("upload");
    var fileInput = function () {
        return document.getElementById("fileinput");
    };

    var doRender = function (ev) {
        document.getElementById("files").outerHTML = this.responseText;
        fileInput().outerHTML = fileInput().outerHTML; // clear selection
    };

    var doLoad = function (ev) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", doRender.bind(req), false);
        req.open("GET", agent, true);
        req.send();
    };

    var doUpload = function (ev) {
        var data = new FormData();
        Array.prototype.forEach.call(fileInput().files, function (file) {
            data.append("file", file);
        });
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("POST", agent, true);
        req.send(data);
    };

    upload.addEventListener("click", doUpload, false);
    doLoad();
}, false);
