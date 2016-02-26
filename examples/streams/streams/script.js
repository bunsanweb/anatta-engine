window.addEventListener("agent-load", ev => {
    "use strict";
    
    const orbUri = "orb:/";
    const createDocument = (title) =>
              document.implementation.createHTMLDocument(title);
    const source = StreamerSource({
        href: orbUri,
        selector: {entries: "[rel=entry]"},
        entriesMax: 20,
        waitRefresh: 500,
        createDocument: createDocument
    });
    const post = StreamerPost({
        href: orbUri,
        entryTemplate: document.querySelector("#entryTemplate"),
        activityTemplate: document.querySelector("#activityTemplate"),
        createDocument: createDocument
    });
    
    window.addEventListener("agent-access", ev => {
        //console.log("access");
        ev.detail.accept();
        //console.log([ev.detail.request.method, ev.detail.request.href,]);
        switch (ev.detail.request.method) {
        case "GET": return source.get(ev);
        case "POST": return post.post(ev);
        default: return ev.detail.respond(
            "405", {allow: "GET, POST"}, "Allow GET or POST");
        }
    }, false);
}, false);
