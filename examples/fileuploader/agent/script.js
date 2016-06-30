/*global anatta*/
"use strict";
window.addEventListener("agent-load", ev => {
    const files = document.querySelector("#files");

    const updateFiles = (file) => {
        const url = `/orb/${encodeURIComponent(file.filename)}`;
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.textContent = file.filename;
        const li = document.createElement("li");
        li.appendChild(a);
        files.appendChild(li);
    };

    const putOrb = (file) => {
        const url = `root:/orb/${encodeURIComponent(file.filename)}`;
        return anatta.engine.link({href: url}).put(file);
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        const render = () => ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, files.outerHTML);
        if (ev.detail.request.method === "GET") return render();
        if (ev.detail.request.method === "POST") {
            const formdata = anatta.form.decode(ev.detail.request);
            return Promise.all(formdata.file.map(putOrb)).then(
                () => formdata.file.map(updateFiles)).then(render);
        }
        return ev.detail.respond("405", {allow: "GET,POST"}, "");
    }, false);
}, false);
