"use strict";
window.addEventListener("load", function (ev) {
    var url = "/files/";
    var upload = document.querySelector("#upload");
    var fileinput = document.querySelector("#fileinput");

    var doRender = function (ev) {
        var plain = this.status == 200 ? this.responseText : "";
        document.querySelector("#files").outerHTML = plain;
    };

    var doLoad = function (ev) {
        var req = new XMLHttpRequest();
        var render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };

    var doUpload = function (ev) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("POST", url, true);
        var data = new FormData();
        data.append("file", fileinput.files[0]);
        req.send(data);
    };
    upload.addEventListener("click", doUpload, false);
    doLoad();
}, false);
