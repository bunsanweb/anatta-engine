(function (root, factory) {
    if (typeof exports === "object") module.exports = factory;
    else root.StreamerSource = factory(root);
})(this, function (window) {
    "use strict";

    var anatta = window.anatta;
    return function (opts) {
        opts.selector = opts.selector || {};
        opts.selector.entries = opts.selector.entries || "[rel=entry]";
        opts.entriesMax = opts.entriesMax || 20;
        opts.waitRefresh = opts.waitRefresh || 500;
        
        var onGet = function (ev) {
            var pathname = ev.detail.request.location.pathname;
            var id = pathname.match(/\/([^\/]+)$/);
            if (id) return respondActivity(ev, id[1]);
            return getIndexDoc().then(function (index) {
                var view = renderMessage(ev.detail.request, index);
                return respondMessage(ev, view);
            }).catch(function (err) {
                console.log(err.stack);
            });
        };
        
        var respondActivity = function (ev, id) {
            var activityUri = anatta.builtin.url.resolve(opts.href, id);
            var link = anatta.engine.link({href: activityUri});
            return link.get().then(function (entity) {
                var res = entity.response;
                return ev.detail.respond(res.status, res.headers, res.body);
            });
        };
        
        var getIndexDoc = function () {
            var indexUri = opts.href;
            var link = anatta.engine.link({href: indexUri});
            return link.get().then(function (entity) {
                if (entity.response.status == "200") return {
                    doc: entity.html,
                    date: new Date(entity.response.headers["last-modified"]),
                };
                return {
                    doc: emptyIndex(),
                    date: new Date(0),
                };
            });
        };
        var emptyIndex = function () {
            return opts.createDocument("activity index");
        };
        var respondMessage = function (ev, view) {
            ev.detail.respond("200", {
                "content-type": "text/html;charset=utf-8",
                "last-modified": view.date.toUTCString(),
                "cache-control": "no-cache",
            }, "<!doctype html>" + view.doc.documentElement.outerHTML);
        };
        
        var renderMessage = function (req, index) {
            if (req.location.query.backward) return renderBackward(req, index);
            if (req.location.query.refresh) return renderRefresh(req, index);
            return renderHead(req, index);
        };
        var renderHead = function (req, index) {
            var count = req.location.query.count || opts.entriesMax;
            var all = index.doc.querySelectorAll(opts.selector.entries);
            var entries = Array.prototype.slice.call(all, 0, count);
            return render(req, index, entries);
        };
        var renderRefresh = function (req, index) {
            // from head to refresh id;
            var count = req.location.query.count || opts.entriesMax;
            var id = req.location.query.refresh;
            var all = index.doc.querySelectorAll(opts.selector.entries);
            var last = count;
            for (var i = 0; i < all.length; i++) {
                if (i >= count) break;
                if (all[i].id === id) {
                    last = i;
                    break;
                }
            }
            var entries = Array.prototype.slice.call(all, 0, last);
            return render(req, index, entries);
        };
        var renderBackward = function (req, index) {
            // from backward id (to until id)
            var count = req.location.query.count || opts.entriesMax;
            var id = req.location.query.backward;
            var until = req.location.query.until;
            var entries = [];
            var cursor = index.doc.querySelector("#" + id);
            if (cursor) {
                for (var entry = cursor.nextSibling, size = 0;
                     entry && size < count;
                     entry = entry.nextSibling, size++) {
                    if (entry.id === until) break;
                    entries.push(entry);
                }
            }
            return render(req, index, entries);
        };
        var render = function (req, index, entries) {
            var loc = req.location;
            var pathname = loc.pathname;
            var doc = opts.createDocument("activity stream");
            var meta = createMeta(doc, "wait", opts.waitRefresh);
            doc.head.appendChild(meta);
            var refresh = createLink(doc, "refresh", pathname);
            doc.head.appendChild(refresh);
            var backward = createLink(doc, "backward", pathname);
            doc.head.appendChild(backward);
            
            var queries = linkQuery(req, entries);
            refresh.setAttribute("href", queryHref(req, queries.refresh));
            backward.setAttribute("href", queryHref(req, queries.backward));
            
            var main = doc.createElement("main");
            doc.body.appendChild(main);
            entries.forEach(function (entry) {
                main.appendChild(doc.importNode(entry, true));
            });
            
            // for debug
            var div = doc.createElement("div");
            var refrA = doc.createElement("a");
            refrA.setAttribute("href", refresh.getAttribute("href"));
            refrA.textContent = "refresh";
            var backA = doc.createElement("a");
            backA.setAttribute("href", backward.getAttribute("href"));
            backA.textContent = "backward";
            div.appendChild(refrA);
            div.appendChild(doc.createTextNode("|"));
            div.appendChild(backA);
            doc.body.appendChild(div);
            
            return {doc: doc, date: index.date};
        };
        
        // Spec of message links
        var linkQuery = function (req, entries) {
            var query = req.location.query;
            var c = query.count || opts.entriesMax;
            var bid = query.backward;
            var uid = query.until;
            var rid = query.refresh;
            if (entries.length) {
                var fid = entries[0].id;
                var lid = entries[entries.length - 1].id;
                // req: "/?backward=bid&until=uid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=last.id&until=uid&refresh=rid"
                if (bid && rid && uid) return {
                    refresh: {count: c, refresh: rid},
                    backward: {count: c, backward: lid, refresh: rid, 
                               until: uid},
                };
                // req: "/?backward=bid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=last.id&refresh=rid"
                if (bid && rid) return {
                    refresh: {count: c, refresh: rid},
                    backward: {count: c, backward: lid, refresh: rid},
                };
                // req: "/?refresh=rid"
                // - refresh: "/?refresh=first.id"
                // - backward: "/?backward=last.id&until=rid&refresh=first.id"
                if (rid) return {
                    refresh: {count: c, refresh: fid},
                    backward: {count: c, backward: lid, refresh: fid, 
                               until: rid},
                };
                // req: "/"
                // - refresh: "/?refresh=first.id"
                // - backward: "/?backward=last.id&refresh=first.id"
                return {
                    refresh: {count: c, refresh: fid},
                    backward: {count: c, backward: lid, refresh: fid},
                };
            } else {// when empty message
                // req: "/?backward=bid&until=uid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=bid&until=uid&refresh=rid"
                if (bid && rid && uid) return {
                    refresh: {count: c, refresh: rid},
                    backward: {count: c, backward: bid, refresh: rid, 
                               until: uid},
                };
                // req: "/?backward=bid&refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=bid&refresh=rid"
                if (bid && rid) return {
                    refresh: {count: c, refresh: rid},
                    backward: {count: c, backward: bid, refresh: rid},
                };
                // req: "/?refresh=rid"
                // - refresh: "/?refresh=rid"
                // - backward: "/?backward=rid&until=rid&refresh=rid"
                if (rid) return {
                    refresh: {count: c, refresh: rid},
                    backward: {count: c, backward: rid, refresh: rid, 
                               until: rid},
                };
                // req: "/"
                // - refresh: "/"
                // - backward: "/"
                return {
                    refresh: {count: c},
                    backward: {count: c},
                };
            }
        };
        
        var createMeta = function (doc, name, content) {
            var meta = doc.createElement("meta");
            meta.name = name;
            meta.content = content;
            return meta;
        };
        var createLink = function (doc, rel, href) {
            var link = doc.createElement("link");
            link.rel = rel;
            link.setAttribute("href", href);
            return link;
        };
        var queryHref = function (req, query) {
            return anatta.builtin.url.format(
                {pathname: req.location.pathname, query: query});
        };
        
        return {
            get: onGet,
        };
    };
});
