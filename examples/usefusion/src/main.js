window.addEventListener("agent-load", function (ev) {
    var template = document.querySelector(".items");
    var data = {
        title: "My News",
        href: "http://example.org/",
        links: [
            {title: "Hello", tags: "greeting", content: "Hello Fusion"},
            {title: "Good Bye",
             content: "<span style='color: red'>...</span>"},
        ],
    };
    
    window.addEventListener("agent-access", function (ev) {
        ev.detail.accept();
        var doc = document.implementation.createHTMLDocument("fusioned");
        var content = window.fusion(data, template, doc);
        doc.body.appendChild(content);
        ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, doc.documentElement.outerHTML);
    }, false);
}, false);
