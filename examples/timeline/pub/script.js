"use strict";

window.addEventListener("load", ev => {
    const followings = document.getElementById("followings");
    const timeline = document.getElementById("timeline");
    const follow = document.getElementById("follow");
    const follower = document.getElementById("follower");
    const post = document.getElementById("post");
    const source = document.getElementById("source");
    const backward = document.getElementById("backward");
    const timelineUri = "/timeline/";
    const statusesUri = "/statuses/";
    const waits = {continued: 500, interval: 5000};

    const Request = (method, uri, callback) => {
        const req = new XMLHttpRequest();
        req.addEventListener("load", callback, false);
        req.open(method, uri, true);
        return req;
    };

    const Data = (obj) => {
        const data = new FormData();
        Object.keys(obj).forEach(key => data.append(key, obj[key]));
        return data;
    };
    
    const setReblogEvent = (entry) => {
        const from = entry.querySelector(".from");
        const reblog = entry.querySelector(".reblog");
        if (from.querySelector(".href").href != document.baseURI) {
            reblog.addEventListener("click", () => {
                const req = Request("POST", statusesUri,
                                    () => streamer.refresh());
                const uri =
                          reblog.parentNode.querySelector(".id > .href").href;
                const author = entry.querySelector(".author > .href");
                const via = author ? author.href : "";
                req.send(Data({
                    author: document.baseURI,
                    href: uri, selector: "article", via: via
                }));
            });
        } else {
            entry.removeChild(from);
            entry.removeChild(reblog);
        }
    };

    const streamer = Streamer(
        timelineUri, entry => timeline.ownerDocument.importNode(entry, true));
    streamer.on("clear", () => {
        followings.innerHTML ="";
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
        const req = Request("POST", timelineUri, () => streamer.load());
        req.send(Data({follower: follower.value}));
        follower.value = "";
    }, false);
    follower.value = "";

    post.addEventListener("click", () => {
        const req = Request("POST", statusesUri, () => streamer.refresh());
        req.send(Data({source: source.value}));
        source.value = "";
    }, false);
    source.value = "";
    backward.addEventListener("click", () => streamer.backward(), false);

    const req = Request("POST", timelineUri, () => streamer.load());
    req.send(Data({follower: document.baseURI}));
});
