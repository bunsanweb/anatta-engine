"use strict";

window.addEventListener("load", function (ev) {
    var packageUri = document.getElementById("packageUri");
    var packages = document.getElementById("packages");
    var add = document.getElementById("add");
    var agent = "/package/";

    var doRender = function (ev) {
        var doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = this.responseText;
        var packages_ = doc.getElementById("packages");
        packages.innerHTML = packages_ ? packages_.innerHTML : "";
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
        req.send(Data(packageUri));
        packageUri.value = "";
    }, false);
    packageUri.value = "";

    doLoad();
});
