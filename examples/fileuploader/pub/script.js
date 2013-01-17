"use strict";
window.addEventListener("load", function (ev) {
    var doRender = function (ev) {
        var plain = this.status == 200 ? this.responseText : "";
        document.querySelector("#files").outerHTML = plain;
    };

    var doLoad = function (ev) {
        var url = "/files/";
        var req = new XMLHttpRequest();
        var render = doRender.bind(req);
        req.addEventListener("load", render, false);
        req.open("GET", url, true);
        req.send();
    };

    var doUpload = function (ev) {
        var url = "/files/";
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("POST", url, true);
        var data = new FormData();
        var fileinput = document.querySelector("#fileinput");
        data.append("file", fileinput.files[0]);
        req.send(data);
    };
    document.querySelector("#upload").addEventListener("click", doUpload, false);
    doLoad();
}, false);
