(function (root, factory) {
    if (typeof exports === "object") module.exports = factory;
    else root.StreamerPost = factory(root);
})(this, function (window) {
    "use strict";
    
    var anatta = window.anatta;
    return function (opts) {
        var taskLane = anatta.q({});
        var onPost = function (ev) {
            var data = anatta.form.decode(ev.detail.request);
            var info = formToInfo(data);
            var activity = makeActivity(info);
            taskLane = taskLane.then(function () {
                return storeActivity(activity, info);
            }).then(getIndex).then(function (index) {
                return updateIndex(index, info);
            }).then(function () {
                var loc = anatta.builtin.url.resolve(
                    ev.detail.request.origin().href, info.id);
                return ev.detail.respond("303", {location: loc});
            }, function (err) {
                console.log(err.stack);
                return ev.detail.respond("500", {}, "");
            });
        };
        
        var updateIndex = function (index, info) {
            var rellink = info.id;
            var doc = index.html;
            var entry = fusion(info, opts.entryTemplate, doc);
            // insert arrived activity to head of index
            doc.body.insertBefore(entry, doc.body.firstChild);
            var indexUri = opts.href;
            var link = anatta.engine.link({href: indexUri});
            return putDoc(link, doc);
        };
        
        var getIndex = function () {
            var indexUri = opts.href;
            var link = anatta.engine.link({href: indexUri});
            return link.get().then(function (entity) {
                if (entity.response.status == "200") return entity;
                return putDoc(link, emptyIndex());
            });
        };
        
        var emptyIndex = function () {
            return opts.createDocument("activity index");
        };
        
        var putDoc = function (link, doc) {
            return link.put({
                headers: {
                    "content-type": "text/html;charset=utf-8",
                    "last-modified": new Date().toUTCString(),
                },
                body: "<!doctype html>" + doc.documentElement.outerHTML,
            });
        };
        
        var storeActivity = function (activity, info) {
            var storeUri = anatta.builtin.url.resolve(opts.href, info.id);
            return putDoc(anatta.engine.link({href: storeUri}), activity);
        };
        
        var makeActivity = function (info) {
            var doc = opts.createDocument("activity");
            var article = fusion(info, opts.activityTemplate, doc);
            //console.log(article.outerHTML);
            doc.body.appendChild(article);
            return doc;
        };
        
        var genId = function (prefix, ts) {
            // time part
            ts = ts || new Date();
            var base = ts.getTime().toString(16);
            for (var i = base.length; i < 14; i++) {
                base = "0" + base;
            };
            // random part
            var dv = new DataView(new ArrayBuffer(8));
            dv.setFloat64(0, Math.random(), false);
            for (var i = 0; i < dv.buffer.byteLength; i++) {
                base += dv.getUint8(i).toString(16);
            }
            return (prefix || "id-") + base;
        };
        
        var formToInfo = function (data) {
            var now = new Date();
            return {
                id: genId("act-", now),
                action: data.action,
                content: data.content,
                tag: data.tag,
                date: now.toUTCString(),
                actorName: data.actorName,
                actorHref: data.actorHref,
                targetName: data.targetName,
                targetHref: data.targetHref,
            };
        };
        
        return {
            post: onPost,
        };
    };
});
