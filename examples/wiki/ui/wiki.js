"use strict";
window.addEventListener("load", function (ev) {
    var title = document.getElementById("title");
    var heading = document.getElementById("heading");
    var content = document.getElementById("content");
    var source = document.getElementById("source");
    var update = document.getElementById("update");
    
    var init = function () {
        window.addEventListener("hashchange", doLoad, false);
        update.addEventListener("click", doUpdate, false);
        if (!window.location.hash) {
            window.location.hash = "FrontPage";
        } else {
            doLoad();
        }
    };
    
    var doLoad = function (ev) {
        var name = location.hash.substring(1);
        var url = "/orb/" + name;
        var req = new XMLHttpRequest();
        var renderer = doRender.bind(req);
        req.addEventListener("load", renderer, false);
        req.addEventListener("error", renderer, false);
        req.open("GET", url, true);
        req.send();
    };
    var doRender = function (ev) {
        var plain = this.status === 200 ? this.responseText : "";
        title.textContent = heading.textContent = name;
        content.innerHTML = plain.replace(wikiName, linker);
        source.value = plain;
    };
    var wikiName = /\[\[([^\]]+)\]\]/g;
    var linker = function (match, name) {
        return "<a href='#" + name + "'>" + name + "</a>";
    };
    
    var doUpdate = function (ev) {
        var name = location.hash.substring(1);
        var url = "/orb/" + name;
        var req = new XMLHttpRequest();
        req.addEventListener("load", doLoad, false);
        req.open("PUT", url, true);
        req.setRequestHeader("content-type", "text/plain;charset=UTF-8");
        req.send(source.value);
    };
    
    init();
}, false);
