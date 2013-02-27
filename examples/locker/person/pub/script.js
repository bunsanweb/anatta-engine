"use strict";

window.addEventListener("load", function (ev) {
    var registerd = document.getElementById("registered");
    var house = document.getElementById("house");
    var register = document.getElementById("register");
    var pem = document.getElementById("pem");
    var pubkeys = document.getElementById("pubkeys");
    var add = document.getElementById("add");
    var agent = "/agent/";

    var doRender = function (ev) {
        var doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = this.responseText;
        var house_ = doc.querySelector("link[rel='house']");
        registered.textContent = house_ ? house_.href : "";
        var pubkeys_ = doc.getElementById("pubkeys");
        pubkeys.innerHTML = pubkeys_ ? pubkeys_.innerHTML : "";
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

    register.addEventListener("click", function () {
        var req = Request("POST");
        req.send(Data(house));
        house.value = "";
    }, false);
    house.value = "";

    add.addEventListener("click", function () {
        var req = Request("POST");
        req.send(Data(pem));
        pem.value = "";
    }, false);
    pem.value = "";

    doLoad();
});
