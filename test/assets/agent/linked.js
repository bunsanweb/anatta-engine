"use strict";

//console.log("boot");
window.addEventListener("agent-load", function (ev) {
  //console.log("load");
  window.addEventListener("agent-access", function (ev) {
    //console.log("access");
    if (ev.detail.request.method !== "GET") return;
    ev.detail.accept();
    ev.detail.respond("200", {
      "content-type": "text/plain;charset=utf-8"
    }, "Hello from Linked Script!");
  }, false);
}, false);
