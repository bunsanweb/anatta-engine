"use strict";

window.addEventListener("agent-load", ev => {
    const template = document.querySelector(".items");
    const data = {
        title: "My News",
        href: "http://example.org/",
        links: [
            {title: "Hello", tags: "greeting", content: "Hello Fusion"},
            {
                title: "Good Bye",
                content: "<span style='color: red'>...</span>"
            },
        ],
    };
    
    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        const doc = document.implementation.createHTMLDocument("fusioned");
        const content = window.fusion(data, template, doc);
        doc.body.appendChild(content);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, doc.documentElement.outerHTML);
    }, false);
}, false);
