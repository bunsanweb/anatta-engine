/*eslint no-else-return: 0*/
(function (root, factory) {
    if (typeof exports === "object") module.exports = factory;
    else root.StreamerSource = factory(root);
})(this, window => {
    "use strict";

    const anatta = window.anatta;

    // Handler for activity stream chunk with URI queries of HTTP GET
    // [URI queries]
    // - count=c: chunk size of activities limits to the count
    // - backward=bid: chunk of old activities from the bid activity
    //                 (bid may be the last chunk bottom)
    // - until=uid: with backward, chunk last limited to the uid activity
    // - refresh=rid
    //     - with backward, chunk not depend on the rid,
    //       but the refresh link keeps the rid,
    //     - without backward, chunk is from the newest head
    //       until the rid activity
    //         - when length of the new head and the rid is larger the count,
    //           backward link has until=rid options
    // [options argument]
    // - opts.selector.entries: CSS query for entries Element
    //        (container of each entry) in the index doc
    // - opts.entriesMax: count for max length of activities for the chunk doc
    // - opts.waitRefresh: specified wait span to refresh accesss for clients
    return function (opts) {
        opts.selector = opts.selector || {};
        opts.selector.entries = opts.selector.entries || "[rel=entry]";
        opts.entriesMax = opts.entriesMax || 20;
        opts.waitRefresh = opts.waitRefresh || 500;
        
        const onGet = (ev) => {
            const pathname = ev.detail.request.location.pathname;
            const id = pathname.match(/\/([^\/]+)$/);
            if (id) return respondActivity(ev, id[1]);
            return getIndexDoc().then(index => {
                const view = renderMessage(ev.detail.request, index);
                return respondMessage(ev, view);
            }).catch(err => console.log(err.stack));
        };
        
        const respondActivity = (ev, id) => {
            const activityUri = anatta.builtin.url.resolve(opts.href, id);
            const link = anatta.engine.link({href: activityUri});
            return link.get().then(entity => {
                const res = entity.response;
                return ev.detail.respond(res.status, res.headers, res.body);
            });
        };
        
        const getIndexDoc = () => {
            const indexUri = opts.href;
            const link = anatta.engine.link({href: indexUri});
            return link.get().then(entity => {
                if (+entity.response.status === 200) {
                    const dateStr = entity.response.headers["last-modified"];
                    return {
                        doc: entity.html,
                        date: new Date(dateStr)
                    };
                }
                return {
                    doc: emptyIndex(),
                    date: new Date(0)
                };
            });
        };
        const emptyIndex = () => opts.createDocument("activity index");
        const respondMessage = (ev, view) => {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8",
                "last-modified": view.date.toUTCString(),
                "cache-control": "no-cache"
            }, `<!doctype html>${view.doc.documentElement.outerHTML}`);
        };
        
        const renderMessage = (req, index) => {
            if (req.location.query.backward) return renderBackward(req, index);
            if (req.location.query.refresh) return renderRefresh(req, index);
            return renderHead(req, index);
        };
        const renderHead = (req, index) => {
            const count = req.location.query.count || opts.entriesMax;
            const all = index.doc.querySelectorAll(opts.selector.entries);
            const entries = Array.from(all).slice(0, count);
            return render(req, index, entries);
        };
        const renderRefresh = (req, index) => {
            // from head to refresh id;
            const count = req.location.query.count || opts.entriesMax;
            const id = req.location.query.refresh;
            const all = index.doc.querySelectorAll(opts.selector.entries);
            let last = count;
            for (let i = 0; i < all.length; i++) {
                if (i >= count) break;
                if (all[i].id === id) {
                    last = i;
                    break;
                }
            }
            const entries = Array.from(all).slice(0, last);
            return render(req, index, entries);
        };
        const renderBackward = (req, index) => {
            // from backward id (to until id)
            const count = req.location.query.count || opts.entriesMax;
            const id = req.location.query.backward;
            const until = req.location.query.until;
            const entries = [];
            const cursor = index.doc.querySelector(`#${id}`);
            if (cursor) {
                for (let entry = cursor.nextSibling, size = 0;
                     entry && size < count;
                     entry = entry.nextSibling, size++) {
                    if (entry.id === until) break;
                    entries.push(entry);
                }
            }
            return render(req, index, entries);
        };
        const render = (req, index, entries) => {
            const loc = req.location;
            const pathname = loc.pathname;
            const doc = opts.createDocument("activity stream");
            const meta = createMeta(doc, "wait", opts.waitRefresh);
            doc.head.appendChild(meta);
            const refresh = createLink(doc, "refresh", pathname);
            doc.head.appendChild(refresh);
            const backward = createLink(doc, "backward", pathname);
            doc.head.appendChild(backward);
            
            const queries = linkQuery(req, entries);
            refresh.setAttribute("href", queryHref(req, queries.refresh));
            backward.setAttribute("href", queryHref(req, queries.backward));
            
            const main = doc.createElement("main");
            doc.body.appendChild(main);
            entries.forEach(
                entry => main.appendChild(doc.importNode(entry, true)));
            
            // for debug
            const div = doc.createElement("div");
            const refrA = doc.createElement("a");
            refrA.setAttribute("href", refresh.getAttribute("href"));
            refrA.textContent = "refresh";
            const backA = doc.createElement("a");
            backA.setAttribute("href", backward.getAttribute("href"));
            backA.textContent = "backward";
            div.appendChild(refrA);
            div.appendChild(doc.createTextNode("|"));
            div.appendChild(backA);
            doc.body.appendChild(div);
            
            return {doc, date: index.date};
        };
        
        // Spec of message links
        const linkQuery = (req, entries) => {
            const query = req.location.query;
            const c = query.count || opts.entriesMax;
            const bid = query.backward;
            const uid = query.until;
            const rid = query.refresh;
            if (entries.length) {
                const fid = entries[0].id;
                const lid = entries[entries.length - 1].id;
                // req: "/?backward=bid&until=uid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=last.id&until=uid&refresh=rid"
                if (bid && rid && uid) {
                    return {
                        refresh: {count: c, refresh: rid},
                        backward: {count: c, backward: lid, refresh: rid,
                                   until: uid}
                    };
                }
                // req: "/?backward=bid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=last.id&refresh=rid"
                if (bid && rid) {
                    return {
                        refresh: {count: c, refresh: rid},
                        backward: {count: c, backward: lid, refresh: rid}
                    };
                }
                // req: "/?refresh=rid"
                // - refresh: "/?refresh=first.id"
                // - backward: "/?backward=last.id&until=rid&refresh=first.id"
                if (rid) {
                    return {
                        refresh: {count: c, refresh: fid},
                        backward: {count: c, backward: lid, refresh: fid,
                                   until: rid}
                    };
                }
                // req: "/"
                // - refresh: "/?refresh=first.id"
                // - backward: "/?backward=last.id&refresh=first.id"
                return {
                    refresh: {count: c, refresh: fid},
                    backward: {count: c, backward: lid, refresh: fid}
                };
            } else {// when empty message
                // req: "/?backward=bid&until=uid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=bid&until=uid&refresh=rid"
                if (bid && rid && uid) {
                    return {
                        refresh: {count: c, refresh: rid},
                        backward: {count: c, backward: bid, refresh: rid,
                                   until: uid}
                    };
                }
                // req: "/?backward=bid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=bid&refresh=rid"
                if (bid && rid) {
                    return {
                        refresh: {count: c, refresh: rid},
                        backward: {count: c, backward: bid, refresh: rid}
                    };
                }
                // req: "/?refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=rid&until=rid&refresh=rid"
                if (rid) {
                    return {
                        refresh: {count: c, refresh: rid},
                        backward: {count: c, backward: rid, refresh: rid,
                                   until: rid}
                    };
                }
                // req: "/"
                // - refresh: "/"
                // - backward: "/"
                return {
                    refresh: {count: c},
                    backward: {count: c}
                };
            }
        };
        
        const createMeta = (doc, name, content) => {
            const meta = doc.createElement("meta");
            meta.name = name;
            meta.content = content;
            return meta;
        };
        const createLink = (doc, rel, href) => {
            const link = doc.createElement("link");
            link.rel = rel;
            link.setAttribute("href", href);
            return link;
        };
        const queryHref = (req, query) => anatta.builtin.url.format(
            {pathname: req.location.pathname, query});
        
        return {
            get: onGet
        };
    };
});
