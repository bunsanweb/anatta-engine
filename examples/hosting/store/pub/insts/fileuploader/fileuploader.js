"use strict";
window.addEventListener("agent-load", ev => {
    const files = document.querySelector("#files");
    const orb = document.querySelector("link[rel='orb']").getAttribute("href");
    let root = "";

    const updateFiles = (file) => {
        const url = `${orb}/${encodeURIComponent(file.filename)}`;
        const a = document.createElement("a");
        a.setAttribute("href", url);
        a.textContent = file.filename;
        const li = document.createElement("li");
        li.appendChild(a);
        files.appendChild(li);
    };

    const putOrb = (file) => {
        const path = `${orb}/${encodeURIComponent(file.filename)}`;
        const url = anatta.builtin.url.resolve(root, path);
        return anatta.engine.link({href: url}).put(file);
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        root = ev.detail.request.href;
        const render = () => ev.detail.respond("200", {
            "content-type": "text/html;charset=utf-8"
        }, files.outerHTML);
        if (ev.detail.request.method == "GET") return render();
        if (ev.detail.request.method == "POST") {
            const formdata = anatta.form.decode(ev.detail.request);
            return Promise.all(formdata.file.map(putOrb)).then(
                () => formdata.file.map(updateFiles)).then(render);
        }
    }, false);
}, false);
