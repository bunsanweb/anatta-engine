window.addEventListener("agent-load", function (ev) {
    "use strict";
    
    var streams = Streams();
    var orb = OrbStream();
    
    window.addEventListener("agent-access", function (ev) {
        //console.log("access");
        ev.detail.accept();
        switch (ev.detail.request.method) {
        case "GET": return streams.get(ev);
        case "POST": return orb.post(ev);
        }
        ev.detail.respond("405", {allow: "GET, POST"}, "Allow GET or POST");
    }, false);
}, false);
