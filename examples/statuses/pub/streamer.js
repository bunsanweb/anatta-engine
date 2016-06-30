"use strict";

window.Streamer = (function build() {
    const Streamer = function Streamer(uri, formatter) {
        return Object.create(Streamer.prototype, {
            uri: {value: uri},
            formatter: {
                value: formatter || (entry => document.importNode(entry, true))
            },
            links: {value: {refresh: "", backward: ""}},
            ents: {value: []},
            entries: {value: document.createElement("div")},
            events: {value: {
                clear: () => {},
                insert: () => {},
                refresh: () => {}
            }},
            selectors: {value: {
                entries: "article",
                refresh: 'link[rel="refresh"]',
                backward: 'link[rel="backward"]'
            }}
        });
    };
    // public methods
    Streamer.prototype.on = function on(event, handler) {
        this.events[event] = handler || (() => {});
        return this;
    };

    Streamer.prototype.spawn = function spawn(name, ...args) {
        try {
            Reflect.apply(this.events[name], this, args);
        } catch (ex) {}
    };

    Streamer.prototype.load = function load() {
        getHtml(this.uri).then(doc => handlers.load(this, doc));
    };
    Streamer.prototype.refresh = function refresh() {
        getHtml(this.links.refresh).then(doc => handlers.refresh(this, doc));
    };
    Streamer.prototype.backward = function backward() {
        getHtml(this.links.backward).then(doc => handlers.backward(this, doc));
    };

    const handlers = {
        load(streamer, doc) {
            streamer.entries.innerHTML = "";
            streamer.spawn("clear");
            streamer.links.refresh = getHref(doc, streamer.selectors.refresh);
            streamer.links.backward =
                getHref(doc, streamer.selectors.backward);
            const entries = doc.querySelectorAll(streamer.selectors.entries);
            const updated = updates.load(streamer, entries);
            streamer.spawn("refresh", updated);
        },
        refresh(streamer, doc) {
            streamer.links.refresh = getHref(doc, streamer.selectors.refresh);
            const entries = doc.querySelectorAll(streamer.selectors.entries);
            const updated = updates.refresh(streamer, entries);
            streamer.spawn("refresh", updated);
        },
        backward(streamer, doc) {
            streamer.links.backward =
                getHref(doc, streamer.selectors.backward);
            const entries = doc.querySelectorAll(streamer.selectors.entries);
            updates.backward(streamer, entries);
        }
    };

    const updates = {
        load(streamer, entries) {
            return Array.from(entries).reduce(
                (updated, entry) => updates.insert(streamer, entry, () => {}),
                false);
        },
        refresh(streamer, entries) {
            const entriesArray = Array.from(entries);
            entriesArray.reverse();
            return entriesArray.reduce(
                (updated, entry) =>
                    updates.insert(streamer, entry, cont => cont.firstChild),
                false);
        },
        backward(streamer, entries) {
            return Array.from(entries).reduce(
                (updated, entry) => updates.insert(streamer, entry, () => {}),
                false);
        },
        insert(streamer, entry, getter) {
            if (streamer.entries.querySelector(`#${entry.id}`)) return false;
            const pivot = getter(streamer.entries);
            const e = streamer.entries.ownerDocument.importNode(entry, true);
            streamer.entries.insertBefore(e, pivot);
            const id = pivot ? pivot.id : null;
            streamer.spawn("insert", streamer.formatter(entry), id);
            return true;
        }
    };

    const parseHtml = (html) => {
        const doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = html;
        return doc;
    };

    const getHtml = (uri) => new Promise((f, r) => {
        if (!uri) return void r(null);
        const req = new XMLHttpRequest();
        req.addEventListener(
            "load", ev => f(parseHtml(req.responseText)), false);
        req.open("GET", uri, true);
        req.send();
        return undefined;
    });

    const getHref = (doc, selector) => {
        const elem = doc.querySelector(selector);
        return elem ? elem.href : "";
    };

    return Streamer;
})();
