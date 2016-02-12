"use strict";
window.addEventListener("agent-load", ev => {
    const files = document.querySelector("#files");

    const updateFiles = (file) => {
        const li = document.createElement("li");
        files.appendChild(li);
        const a = document.createElement("a");
        li.appendChild(a);
        
        const uri = `/orb/${encodeURIComponent(file.filename)}`;
        a.setAttribute("href", uri);
        a.textContent = file.filename;
    };

    const putOrb = (file) => {
        const uri = `private:/orb/${encodeURIComponent(file.filename)}`;
        return anatta.engine.link({href: uri}).put(file);
    };

    window.addEventListener("agent-access", ev => {
        ev.detail.accept();
        const render = () => {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, files.outerHTML);
        };
        if (ev.detail.request.method == "GET") return render();
        if (ev.detail.request.method == "POST") {
            const formdata = anatta.form.decode(ev.detail.request);
            return Promise.all(formdata.file.map(putOrb)).then(
                () => formdata.file.map(updateFiles)).then(render);
        }
    }, false);
}, false);
