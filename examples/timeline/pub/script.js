/*eslint max-statements: [2, 25]*/
/*global Streamer*/
"use strict";

window.addEventListener("load", ev => {
    const followings = document.getElementById("followings");
    const timeline = document.getElementById("timeline");
    const follow = document.getElementById("follow");
    const follower = document.getElementById("follower");
    const post = document.getElementById("post");
    const source = document.getElementById("source");
    const backward = document.getElementById("backward");
    const timelineUri = "/timeline/", statusesUri = "/statuses/";
    const waits = {continued: 500, interval: 5000};

    const request = (method, uri, data) => new Promise((f, r) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", f, false);
        req.open(method, uri, true);
        req.send(data);
    });
    
    const formData = (obj) => {
        const data = new FormData();
        Object.keys(obj).forEach(key => data.append(key, obj[key]));
        return data;
    };
    
    const setReblogEvent = (entry) => {
        const from = entry.querySelector(".from");
        const reblog = entry.querySelector(".reblog");
        if (from.querySelector(".href").href !== document.baseURI) {
            reblog.addEventListener("click", () => {
                const uri =
                          reblog.parentNode.querySelector(".id > .href").href;
                const author = entry.querySelector(".author > .href");
                const via = author ? author.href : "";
                const req = request("POST", statusesUri, formData({
                    author: document.baseURI,
                    href: uri, selector: "article", via
                }));
                req.then(() => streamer.refresh());
            });
        } else {
            entry.removeChild(from);
            entry.removeChild(reblog);
        }
    };

    const streamer = Streamer(
        timelineUri, entry => timeline.ownerDocument.importNode(entry, true));
    streamer.on("clear", () => {
        followings.innerHTML = "";
        timeline.innerHTML = "";
    });
    streamer.on("insertFollowing",
                following => followings.appendChild(following));
    streamer.on("insert", (entry, id) => {
        const elem = timeline.querySelector(`#${id}`);
        timeline.insertBefore(entry, elem);
        setReblogEvent(entry);
    });
    streamer.on("refresh", updated => setTimeout(
        () => streamer.refresh(),
        updated ? waits.continued : waits.interval));

    follow.addEventListener("click", () => {
        const req = request("POST", timelineUri,
                            formData({follower: follower.value}));
        req.then(() => streamer.load());
        follower.value = "";
    }, false);
    follower.value = "";

    post.addEventListener("click", () => {
        const req = request("POST", statusesUri,
                            formData({source: source.value}));
        req.then(() => streamer.refresh());
        source.value = "";
    }, false);
    source.value = "";
    backward.addEventListener("click", () => streamer.backward(), false);

    
    const req = request("POST", timelineUri,
                        formData({follower: document.baseURI}));
    req.then(() => streamer.load());
});
