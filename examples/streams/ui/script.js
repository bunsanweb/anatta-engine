window.addEventListener("load", function (ev) {
    var main = document.querySelector("main");
    var streamUri = "/streams/";
    var streamer = Streamer.Linear({uri: streamUri});
    streamer.on("update", function (entries, position) {
        var next = position ? main.querySelector("#" + position.id) : null;
        entries.forEach(function (entry) {
            var imported = importedEntry(entry);
            if (!next || next.id !== imported.id) {
                return main.insertBefore(imported, next);
            }
            main.replaceChild(imported, next);
            next = imported.nextSibling;
        });
    });
    streamer.load();

    var importedEntry = function (entry) {
        var imported = document.importNode(entry, true);
        var origin = imported.querySelector("[rel=origin]");
        origin.href = streamUri + origin.getAttribute("href");
        return imported;
    };

    var post = Post("/streams/");
    post.onSuccess = function (ev) {
        streamer.refresh();
    };
}, false);
