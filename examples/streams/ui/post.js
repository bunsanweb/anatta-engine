var Post = function (postTo) {
    "use strict";
    
    var input = document.getElementById("input");
    var post = document.getElementById("post");
    
    var handlers = {
        onSuccess: function (ev) {},
        onFailure: function (ev) {alert("error: " + this.status)},
    };
    var onSuccess = function (ev) {
        handlers.onSuccess.call(this, ev);
    };
    var onFailure = function (ev) {
        handlers.onFailure.call(this, ev);
    };
    
    post.addEventListener("click", function (ev) {
        var data = new FormData();
        data.append("action", "tweet");
        data.append("content", input.value);
        data.append("tag", "tweet");
        data.append("actorName", "taro");
        data.append("actorHref", "persona:taro@persona.net");
        data.append("targetHref", location.href);
        data.append("targetName", document.title);
        
        var req = new XMLHttpRequest();
        req.addEventListener("load", onSuccess.bind(req), false);
        req.addEventListener("error", onFailure.bind(req), false);
        req.open("POST", postTo, true);
        req.send(data);
    }, false);

    return handlers;
};
