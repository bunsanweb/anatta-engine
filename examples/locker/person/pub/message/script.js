"use strict";

window.addEventListener("load", function (ev) {
    var text = document.getElementById("text");
    var refresh = document.getElementById("refresh");
    var message = document.getElementById("message");
    var agent = "/agent/";

    var doRender = function (ev) {
        var doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = this.responseText;
        var message_ = doc.getElementById("message");
        message.textContent = message_ ? message_.textContent : "";
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

    refresh.addEventListener("click", function () {
        var req = Request("POST");
        req.send(Data(text));
        text.value = "";
    }, false);
    text.value = "";

    doLoad();
});
