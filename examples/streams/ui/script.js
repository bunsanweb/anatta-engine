"use strict";
window.addEventListener("load", ev => {
    const main = document.querySelector("main");
    const streamUri = "/streams/";
    const streamer = StreamerChannels.Linear({href: streamUri});
    streamer.on("update", (entries, position) => {
        const next = position ? main.querySelector(`#${position.id}`) : null;
        entries.forEach(entry => {
            const imported = importedEntry(entry);
            if (!next || next.id !== imported.id) {
                return main.insertBefore(imported, next);
            }
            main.replaceChild(imported, next);
            next = imported.nextSibling;
        });
    });
    streamer.load();

    const importedEntry = (entry) => {
        const imported = document.importNode(entry, true);
        const origin = imported.querySelector("[rel=origin]");
        origin.href = `${streamUri}${origin.getAttribute("href")}`;
        return imported;
    };

    const post = Post("/streams/");
    post.onSuccess = (ev) => streamer.refresh();
}, false);
