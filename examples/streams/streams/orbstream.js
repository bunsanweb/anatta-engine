var OrbStream = function (opts) {
    "use strict";
    
    var orbUri = "orb:/";
    var entryTemplate = document.querySelector("#entryTemplate");
    var activityTemplate = document.querySelector("#activityTemplate");
    var createDocument = function (title) {
        return document.implementation.createHTMLDocument(title);
    };
    
    var taskLane = anatta.q.resolve({});
    var onPost = function (ev) {
        var data = anatta.form.decode(ev.detail.request);
        var info = formToInfo(data);
        var activity = makeActivity(info);
        taskLane = taskLane.then(function () {
            return storeActivity(activity, info);
        }).then(getIndex).then(function (index) {
            return updateIndex(index, info);
        }).fail(console.log);
        // async no-wait
        return ev.detail.respond("201", {}, "");
    };
    
    var updateIndex = function (index, info) {
        var rellink = info.id;
        var doc = index.html;
        var entry = fusion(info, entryTemplate, doc);
        // insert arrived activity to head of index
        doc.body.insertBefore(entry, doc.body.firstChild);
        var indexUri = orbUri;
        var link = anatta.engine.link({href: indexUri});
        return putDoc(link, doc);
    };
    
    var getIndex = function () {
        var indexUri = orbUri;
        var link = anatta.engine.link({href: indexUri});
        return link.get().then(function (entity) {
            if (entity.response.status == "200") return entity;
            return putDoc(link, emptyIndex());
        });
    };
    
    var emptyIndex = function () {
        return createDocument("activity index");
    };
    
    var putDoc = function (link, doc) {
        return link.put({
            headers: {
                "content-type": "text/html;charset=utf-8",
                "last-modified": new Date().toUTCString(),
            },
            body: "<!doctype html>" + doc.outerHTML,
        });
    };
    
    var storeActivity = function (activity, info) {
        var storeUri = anatta.builtin.url.resolve(orbUri, info.id);
        return putDoc(anatta.engine.link({href: storeUri}), activity);
    };
    
    var makeActivity = function (info) {
        var doc = createDocument("activity");
        var article = fusion(info, activityTemplate, doc);
        console.log(article.outerHTML);
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
            base += dv.buffer[i].toString(16);
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
