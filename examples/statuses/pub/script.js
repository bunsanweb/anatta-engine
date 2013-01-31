"use strict";

window.addEventListener("load", function (ev) {
    var timeline = document.getElementById("timeline");
    var post = document.getElementById("post");
    var source = document.getElementById("source");
    var backward = document.getElementById("backward");
    var streamUri = "/stream/";
    var waits = {continued: 500, interval: 5000};

    var streamer = Streamer(streamUri, function (entry) {
        return document.importNode(entry, true);
    });
    streamer.on("clear", function () {
        timeline.innerHTML = "";
    });
    streamer.on("insert", function (entry, getter) {
        timeline.insertBefore(entry, getter(timeline));
    });
    streamer.on("refresh", function (updated) {
        return setTimeout(streamer.get("refresh"),
            updated ? waits.continued : waits.interval);
    });

    post.addEventListener("click", function () {
        var req = new XMLHttpRequest();
        req.addEventListener("load", streamer.get("refresh"), false);
        req.open("POST", streamUri, true);
        var data = new FormData();
        data.append("source", source.value);
        req.send(data);
        source.value = "";
    }, false);
    source.value = "";
    backward.addEventListener("click", streamer.get("backward"), false);

    streamer.get("load")();
});
