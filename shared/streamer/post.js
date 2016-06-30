/*global fusion*/
(function top(root, factory) {
    if (typeof exports === "object") module.exports = factory;
    else root.StreamerPost = factory(root);
})(this, window => {
    "use strict";
    
    const anatta = window.anatta;
    // Handler for managing FormData post to activity documnet
    // - PUT each activity doc to relative URIs
    // - Update the index doc with append the the activity entry to top
    // [options argument]
    // - opts.createDocument: factory function for new HTMLDocument object
    // - opts.entryTemplate: DOM Element for template of entry of the index doc
    // - opts.activityTemplate: DOM Element for template of
    //      the activity doc (usually article element).
    // - opts.href: URI string of the index doc to get and to update
    return function StreamPost(opts) {
        let taskLane = Promise.resolve({});
        const onPost = (ev) => {
            const data = anatta.form.decode(ev.detail.request);
            const info = formToInfo(data);
            const activity = makeActivity(info);
            taskLane = taskLane.then(() => storeActivity(activity, info)).
                then(getIndex).then(index => updateIndex(index, info)).
                then(() => {
                    const loc = anatta.builtin.url.resolve(
                        ev.detail.request.origin().href, info.id);
                    return ev.detail.respond("303", {location: loc});
                }, err => {
                    console.log(err.stack);
                    return ev.detail.respond("500", {}, "");
                });
        };
        
        const updateIndex = (index, info) => {
            const doc = index.html;
            const entry = fusion(info, opts.entryTemplate, doc);
            // insert arrived activity to head of index
            doc.body.insertBefore(entry, doc.body.firstChild);
            const indexUri = opts.href;
            const link = anatta.engine.link({href: indexUri});
            return putDoc(link, doc);
        };
        
        const getIndex = () => {
            const indexUri = opts.href;
            const link = anatta.engine.link({href: indexUri});
            return link.get().then(entity => {
                if (+entity.response.status === 200) return entity;
                return putDoc(link, emptyIndex());
            });
        };
        
        const emptyIndex = () => opts.createDocument("activity index");
        
        const putDoc = (link, doc) => link.put({
            headers: {
                "content-type": "text/html;charset=utf-8",
                "last-modified": new Date().toUTCString()
            },
            body: `<!doctype html>${doc.documentElement.outerHTML}`
        });

        
        const storeActivity = (activity, info) => {
            const storeUri = anatta.builtin.url.resolve(opts.href, info.id);
            return putDoc(anatta.engine.link({href: storeUri}), activity);
        };
        
        const makeActivity = (info) => {
            const doc = opts.createDocument("activity");
            const article = fusion(info, opts.activityTemplate, doc);
            //console.log(article.outerHTML);
            doc.body.appendChild(article);
            return doc;
        };
        
        const genId = (prefix, ts) => {
            // time part
            ts = ts || new Date();
            const time = ts.getTime().toString(16);
            const thex = `${"0".repeat(14 - time.length)}${time}`;
            // random part
            const dv = new DataView(new ArrayBuffer(8));
            dv.setFloat64(0, Math.random(), false);
            const rhex = Array.from(
                new Uint8Array(dv.buffer),
                v => v < 16 ? `0${v.toString(16)}` : v.toString(16)).join("");
            
            return `${prefix || "id-"}${thex}${rhex}`;
        };
        
        const formToInfo = (data) => {
            const now = new Date();
            return {
                id: genId("act-", now),
                action: data.action,
                content: data.content,
                tag: data.tag,
                date: now.toUTCString(),
                actorName: data.actorName,
                actorHref: data.actorHref,
                targetName: data.targetName,
                targetHref: data.targetHref
            };
        };
        
        return {
            post: onPost
        };
    };
});
