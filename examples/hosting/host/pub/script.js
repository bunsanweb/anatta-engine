"use strict";

window.addEventListener("load", function (ev) {
    var instUri = document.getElementById("instUri");
    var insts = document.getElementById("insts");
    var add = document.getElementById("add");
    var agent = document.querySelector("link[rel='agent']").href;

    var doRender = function (ev) {
        var doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = this.responseText;
        var insts_ = doc.getElementById("insts");
        insts.innerHTML = insts_ ? insts_.innerHTML : "";
    };

    var doLoad = function (ev) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", doRender.bind(req), false);
        req.open("GET", agent, true);
        req.send();
    };

    var Request = function (method) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open(method, agent, true);
        return req;
    };

    var Data = function (elem) {
        var data = new FormData();
        data.append(elem.id, elem.value);
        return data;
    };

    add.addEventListener("click", function () {
        var req = Request("POST");
        req.send(Data(instUri));
        instUri.value = "";
    }, false);
    instUri.value = "";

    doLoad();
});
