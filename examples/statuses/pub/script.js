"use strict";

var streamer = Streamer(10);

streamer.on("init", function () {
    var current = "/agent/";
    return function (ev) {
        var prevButton = document.getElementById("prev");
        prevButton.addEventListener("click", function (ev) {
            streamer.dispatch("prev");
        }, false);
        prevButton.style.visibility = "hidden";

        var source = document.getElementById("source");
        var postButton = document.getElementById("post");
        postButton.addEventListener("click", function (ev) {
            streamer.post(current, source.value, function () {
                streamer.dispatch("next");
            });
            source.value = "";}, false);
        source.value = "";

        var update = function () {
            console.log(streamer.updateRate);
            streamer.dispatch("next");
            setTimeout(update, streamer.updateRate * 1000)
        };
        update();
    }
});

streamer.on("next", function () {
    var container = document.getElementById("statuses");
    if (!streamer.next) {
        var first = container.firstChild;
        var id = !!first? first.id : "";
        streamer.next = "/agent/next/" + id;
    }
    var lastExist = !!container.lastChild;
    streamer.get(streamer.next, function (doc) {
        var statuses = doc.querySelectorAll(".status");
        var first = container.firstChild;
        Array.prototype.forEach.call(statuses, function (status) {
            container.insertBefore(status, first);
        });
        var linkNext = doc.querySelector('link[rel~="next"]');
        if (!!linkNext) {
            streamer.next = linkNext.href;
            streamer.updateRate = 1;
        }
        else {
            streamer.next = "";
            streamer.updateRate = 10;
        }

        if (!lastExist) {
            var prevButton = document.getElementById("prev");
            var linkPrev = doc.querySelector('link[rel~="prev"]');
            if (!!linkPrev) {
                streamer.prev = linkPrev.href;
                prevButton.style.visibility = "visible";
            }
            else {
                streamer.prev = "";
                prevButton.style.visibility = "hidden";
            }
        }
    });
});

streamer.on("prev", function () {
    streamer.get(streamer.prev, function (doc) {
        var container = document.getElementById("statuses");
        var statuses = doc.querySelectorAll(".status");
        Array.prototype.forEach.call(statuses, function (status) {
            container.appendChild(status);
        });
        var link = doc.querySelector('link[rel~="prev"]');
        var prevButton = document.getElementById("prev");
        if (!!link) {
            streamer.prev = link.href;
            prevButton.style.visibility = "visible";
        }
        else {
            streamer.prev = "";
            prevButton.style.visibility = "hidden";
        }
    });
});

window.addEventListener("load", streamer.dispatch("init"), false);
