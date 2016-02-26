const Post = function (postTo) {
    "use strict";
    
    const input = document.getElementById("input");
    const post = document.getElementById("post");
    
    const handlers = {
        onSuccess: (ev) => {console.log(ev.target.responseText);},
        onFailure: (ev) => {alert(`error: ${ev.target.status}`);}
    };
    const onSuccess = (ev) => handlers.onSuccess(ev);
    const onFailure = (ev) => handlers.onFailure(ev);
    
    post.addEventListener("click", ev => {
        const data = new FormData();
        data.append("action", "tweet");
        data.append("content", input.value);
        data.append("tag", "tweet");
        data.append("actorName", "taro");
        data.append("actorHref", "persona:taro@persona.net");
        data.append("targetHref", location.href);
        data.append("targetName", document.title);
        
        const req = new XMLHttpRequest();
        req.addEventListener("load", onSuccess, false);
        req.addEventListener("error", onFailure, false);
        req.open("POST", postTo, true);
        req.send(data);
    }, false);

    return handlers;
};
