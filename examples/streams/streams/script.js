window.addEventListener("agent-load", function (ev) {
    "use strict";
    
    var orbUri = "orb:/";
    var createDocument = function (title) {
        return document.implementation.createHTMLDocument(title);
    };
    var source = StreamerSource({
        href: orbUri,
        selector: {entries: "[rel=entry]",},
        entriesMax: 20,
        waitRefresh: 500,
        createDocument: createDocument,
    });
    var post = StreamerPost({
        href: orbUri,
        entryTemplate: document.querySelector("#entryTemplate"),
        activityTemplate: document.querySelector("#activityTemplate"),
        createDocument: createDocument,
    });
    
    window.addEventListener("agent-access", function (ev) {
        //console.log("access");
        ev.detail.accept();
        //console.log([ev.detail.request.method, ev.detail.request.href,]);
        switch (ev.detail.request.method) {
        case "GET": return source.get(ev);
        case "POST": return post.post(ev);
        }
        ev.detail.respond("405", {allow: "GET, POST"}, "Allow GET or POST");
    }, false);
}, false);