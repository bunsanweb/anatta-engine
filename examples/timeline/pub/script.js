"use strict";

window.addEventListener("load", function (ev) {
    var followings = document.getElementById("followings");
    var timeline = document.getElementById("timeline");
    var follow = document.getElementById("follow");
    var follower = document.getElementById("follower");
    var post = document.getElementById("post");
    var source = document.getElementById("source");
    var backward = document.getElementById("backward");
    var timelineUri = "/timeline/";
    var statusesUri = "/statuses/";
    var waits = {continued: 500, interval: 5000};

    var Request = function (method, uri, callback) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", callback, false);
        req.open(method, uri, true);
        return req;
    };

    var Data = function (obj) {
        var data = new FormData();
        Object.keys(obj).forEach(function (key) {
            data.append(key, obj[key]);
        });
        return data;
    };

    var setReblogEvent = function (entry) {
        var from = entry.querySelector(".from");
        var reblog = entry.querySelector(".reblog");
        if (from.querySelector(".href").href != document.baseURI) {
            reblog.addEventListener("click", function () {
                var req = Request("POST", statusesUri,
                    streamer.get("refresh"));
                var uri = reblog.parentNode.querySelector(".id > .href").href;
                var author = entry.querySelector(".author > .href");
                var via = author ? author.href : "";
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

    var streamer = Streamer(timelineUri, function (entry) {
        return timeline.ownerDocument.importNode(entry, true);
    });
    streamer.on("clear", function () {
        followings.innerHTML ="";
        timeline.innerHTML = "";
    });
    streamer.on("insertFollowing", function (following) {
        followings.appendChild(following);
    });
    streamer.on("insert", function (entry, id) {
        var elem = timeline.querySelector("#" + id);
        timeline.insertBefore(entry, elem);
        setReblogEvent(entry);
    });
    streamer.on("refresh", function (updated) {
        return setTimeout(streamer.get("refresh"),
            updated ? waits.continued : waits.interval);
    });

    follow.addEventListener("click", function () {
        var req = Request("POST", timelineUri, streamer.get("load"));
        req.send(Data({follower: follower.value}));
        follower.value = "";
    }, false);
    follower.value = "";

    post.addEventListener("click", function () {
        var req = Request("POST", statusesUri, streamer.get("refresh"));
        req.send(Data({source: source.value}));
        source.value = "";
    }, false);
    source.value = "";
    backward.addEventListener("click", streamer.get("backward"), false);

    var req = Request("POST", timelineUri, streamer.get("load"));
    req.send(Data({follower: document.baseURI}));
});
