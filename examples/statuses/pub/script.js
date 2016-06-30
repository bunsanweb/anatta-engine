/*global Streamer*/
"use strict";

window.addEventListener("load", ev => {
    const timeline = document.getElementById("timeline");
    const post = document.getElementById("post");
    const source = document.getElementById("source");
    const backward = document.getElementById("backward");
    const streamUri = "/stream/";
    const waits = {continued: 500, interval: 5000};

    const streamer = Streamer(
        streamUri, entry => document.importNode(entry, true));
    streamer.on("clear", () => {timeline.innerHTML = "";});
    streamer.on("insert", (entry, id) => {
        const elem = timeline.querySelector(`#${id}`);
        timeline.insertBefore(entry, elem);
    });
    streamer.on("refresh", updated => setTimeout(
        () => streamer.refresh(), updated ? waits.continued : waits.interval));
    
    post.addEventListener("click", () => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", () => streamer.refresh(), false);
        req.open("POST", streamUri, true);
        const data = new FormData();
        data.append("source", source.value);
        req.send(data);
        source.value = "";
    }, false);
    source.value = "";
    backward.addEventListener("click", () => streamer.backward(), false);

    streamer.load();
});
