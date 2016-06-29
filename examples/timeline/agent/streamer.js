"use strict";

const Streamer = (function () {
    const Streamer = function Streamer(uri, formatter) {
        return Object.create(Streamer.prototype, {
            uri: {value: uri},
            formatter: {
                value: formatter || (entry => document.importNode(entry, true))
            },
            links: {value: {refresh: "", backward: ""}},

            entries: {value: document.createElement("div")},
            events: {value: {
                clear: () => {},
                insert: () => {},
                refresh: () => {}
            }},
        });
    };

    anatta.engine.glossary.add(anatta.termset.desc.create({
        name: "statuses",
        "content-type": "text/html",
        "uri-pattern": "^.*/statuses/.*",
        entity: {
            refresh: {selector: "link[rel='refresh']", value: "href"},
            backward: {selector: "link[rel='backward']", value: "href"},
        }
    }));
    
    // public methods
    Streamer.prototype.on = function (event, handler) {
        this.events[event] = handler || function () {};
        return this;
    };

    Streamer.prototype.spawn = function (name, ...args) {
        try {
            Reflect.apply(this.events[name], this, args);
        } catch (ex) {}
    };

    Streamer.prototype.load = function () {
        getHtml(this.uri).then(entity => handlers.load(this, entity));
    };
    Streamer.prototype.refresh = function () {
        getHtml(this.links.refresh).then(
            entity => handlers.refresh(this, entity));
    };
    Streamer.prototype.backward = function () {
        getHtml(this.links.backward).then(
            entity => handlers.backward(this, entity));
    };

    const handlers = {
        load(streamer, entity) {
            streamer.entries.innerHTML = "";
            streamer.spawn("clear");
            streamer.links.refresh = entity.attr("refresh");
            streamer.links.backward = entity.attr("backward");
            const updated = updates.load(streamer, entity.html);
            streamer.spawn("refresh", updated);
        },
        refresh(streamer, entity) {
            streamer.links.refresh = entity.attr("refresh");
            const updated = updates.refresh(streamer, entity.html);
            streamer.spawn("refresh", updated);
        },
        backward(streamer, entity) {
            streamer.links.backward = entity.attr("backward");
            updates.backward(streamer, entity.html);
        }
    };

    const updates = {
        load(streamer, doc) {
            const articles = doc.querySelectorAll("body > div > article");
            return Array.from(articles).reduce(
                (updated, article) =>
                    updates.insert(streamer, article, () => {}),
                false);
        },
        refresh(streamer, doc) {
            const articles = Array.from(
                doc.querySelectorAll("body > div > article"));
            articles.reverse();
            return articles.reduce(
                (updated, article) =>
                    updates.insert(
                        streamer, article, cont => cont.firstChild) || updated,
                false);
        },
        backward(streamer, doc) {
            const articles = doc.querySelectorAll("body > div > article");
            return Array.from(articles).reduce(
                (updated, article) =>
                    updates.insert(streamer, article, () => {}),
                false);
        },
        insert(streamer, article, getter) {
            if (streamer.entries.querySelector(`#${article.id}`)) return false;
            const pivot = getter(streamer.entries);
            const e = streamer.entries.ownerDocument.importNode(article, true);
            streamer.entries.insertBefore(e, pivot);
            streamer.spawn("insert", streamer.formatter(article));
            return true;
        }
    };

    const getHtml = (uri) => anatta.engine.link({href: uri}).get();

    return Streamer;
})();
