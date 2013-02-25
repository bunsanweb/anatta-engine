"use strict";

window.addEventListener("load", function (ev) {
    var house = document.getElementById("house");
    var pem = document.getElementById("pem");
    var register = document.getElementById("register");
    var text = document.getElementById("text");
    var refresh = document.getElementById("refresh");
    var message = document.getElementById("message");
    var agent = "/agent/";

    var doRender = function (ev) {
        var doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = this.responseText;
        var msg = doc.getElementById("message");
        message.textContent = msg ? msg.textContent : "";
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

    var Data = function (elems) {
        var data = new FormData();
        elems.forEach(function (elem) {
            data.append(elem.id, elem.value);
        });
        return data;
    };

    register.addEventListener("click", function () {
        var req = Request("POST");
        req.send(Data([house, pem]));
        pem.value = "";
    }, false);
    pem.value = "";

    refresh.addEventListener("click", function () {
        var req = Request("POST");
        req.send(Data([house, text]));
        text.value = "";
    }, false);
    text.value = "";

    doLoad();
});
