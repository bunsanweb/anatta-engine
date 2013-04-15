window.addEventListener("load", function (ev) {
    var main = document.querySelector("main");
    var fragments = [];
    var streamUri = "/streams/";
    var streamer = Streamer.Chain({uri: streamUri});
    streamer.on("arrive", function (index, entries, full) {
        var last = null;
        if (fragments[index]) {
            var fraglast = fragments[index][fragments[index].length - 1];
            if (fraglast) {
                var cur = main.querySelector("#" + fraglast.id);
                last = cur.nextSibling;
            }
        } else {
            fragments[index] = full;
            if (fragments[index - 1]) {
                var top = fragments[index - 1][0];
                if (top) last = main.querySelector("#" + top.id);
            }
        }
        entries.forEach(function (entry) {
            var imported = document.importNode(entry, true);
            var origin = imported.querySelector("[rel=origin]");
            origin.href = streamUri + origin.getAttribute("href");
            if (last && last.id === imported.id) {
                main.replaceChild(imported, last);
                last = imported.nextSibling;
            } else {
                main.insertBefore(imported, last);
            }
        });
    });
    streamer.load();
    
    var post = Post("/streams/");
    post.onSuccess = function (ev) {
        streamer.refresh();
    };
}, false);
