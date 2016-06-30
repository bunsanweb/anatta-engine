(function top(root, factory) {
    if (typeof exports === "object") module.exports = factory;
    else root.StreamerChannels = factory(root);
})(this, window => {
    "use strict";
    
    // Streamer that provides single layer view of chain streamer
    const Linear = function Linear(opts) {
        opts = merge(opts, {});
        const chain = Chain(opts);
        const self = Object.create(Linear.prototype, {
            opts: {value: opts},
            chain: {value: chain},
            layers: {value: []},
            entries: {value: [], writable: true},
            handlers: {value: {
                update(updateEntries, positionEntry, isBackward) {}
            }}
        });
        // chain event handling
        chain.on("arrive", linear.arrive.bind(self));
        return self;
    };
    Linear.prototype.on = function on(name, handler) {
        this.handlers[name] = handler;
    };
    Linear.prototype.action = function action(name) {
        return this[name].bind(this);
    };
    Linear.prototype.load = function load() {
        return this.chain.load();
    };
    Linear.prototype.refresh = function refresh() {
        return this.chain.refresh();
    };
    Linear.prototype.backward = function backward() {
        return this.chain.backward();
    };
    const linear = {
        arrive(layerIndex, entries, full) {
            const isBackward = !!this.layers[layerIndex];
            this.layers[layerIndex] = full;
            const old = this.entries;
            this.entries = Reflect.apply(linear.asList, this, []);
            // find pos that is the first overwrapped element in old entries
            // for each entries as entry:
            //     when !pos: col.appendChild(entry);
            //     when pos.id !== entry.id: col.insertBefore(entry, pos);
            //     when pos.id === entry.id: col.replaceChild(entry, pos);
            //     pos = entry.nextSibling;
            let pos = null;
            if (isBackward) {
                const index = indexOf(
                    this.entries, e => e.id === entries[0].id);
                pos = index >= 0 ? old[index] : null;
            } else {
                pos = old.length > 0 ? old[0] : null;
            }
            Reflect.apply(this.handlers.update, this,
                          [entries, pos, isBackward]);
        },
        asList() {
            if (this.layers.length === 0) return [];
            let ret = this.layers[this.layers.length - 1];
            for (let index = this.layers.length - 2; index >= 0; index--) {
                const cur = this.layers[index];
                let head = cur.length;
                for (let i = 0; i < cur.length; i++) {
                    if (ret.some(e => e.id === cur[i].id)) continue;
                    head = i;
                    break;
                }
                ret = ret.concat(cur.slice(head));
            }
            return ret;
        }
    };
    
    // Streamer that chained Fragment streamers
    const Chain = function Chain(opts) {
        opts = merge(opts, {});
        const self = Object.create(Chain.prototype, {
            opts: {value: opts},
            fragments: {value: []},
            handlers: {value: {
                arrive(index, newEntries, fragmentEntries) {}
            }}
        });
        return self;
    };
    Chain.prototype.on = function on(name, handler) {
        this.handlers[name] = handler;
    };
    Chain.prototype.action = function action(name) {
        return this[name].bind(this);
    };
    Chain.prototype.load = function load() {
        const first = Fragment(this.opts);
        this.fragments.push(first);
        Reflect.apply(chain.bindChain, this, [first]);
        first.load();
    };
    Chain.prototype.refresh = function refresh() {
        this.fragments[this.fragments.length - 1].refresh();
    };
    Chain.prototype.backward = function backward() {
        this.fragments[this.fragments.length - 1].backward();
    };
    const chain = {
        bindChain(fragment) {
            const self = this;
            let refreshedOnce = false;
            const index = self.fragments.indexOf(fragment);
            fragment.on(
                "arrive", entries => Reflect.apply(
                    self.handlers.arrive, self,
                    [index, entries, fragment.entries]));
            fragment.on("refresh", fragment => {
                if (refreshedOnce) return;
                refreshedOnce = true;
                self.fragments.push(fragment);
                Reflect.apply(chain.bindChain, self, [fragment]);
                fragment.load();
            });
        }
    };
    
    // Streamer that cached but goes only backward
    // when refreshed, pass new Fragment streamer
    const Fragment = function Fragment(opts) {
        opts = merge(opts, {});
        const basic = Basic(opts);
        const self = Object.create(Fragment.prototype, {
            opts: {value: opts},
            basic: {value: basic},
            entries: {value: [], writable: true},
            date: {value: new Date(0), writable: true},
            handlers: {value: {
                refresh(fragment) {},
                arrive(entries) {}
            }}
        });
        basic.on("load", fragment.onLoad.bind(self));
        basic.on("backward", fragment.onBackward.bind(self));
        return self;
    };
    Fragment.prototype.on = function on(name, handler) {
        this.handlers[name] = handler;
    };
    Fragment.prototype.action = function action(name) {
        return this[name].bind(this);
    };
    Fragment.prototype.load = function load() {
        return this.basic.load();
    };
    Fragment.prototype.backward = function backward() {
        return this.basic.backward();
    };
    Fragment.prototype.refresh = function refresh() {
        const uri = this.basic.link.refresh;
        const opts = merge({href: uri}, this.opts);
        Reflect.apply(this.handlers.refresh, this, [Fragment(opts)]);
    };
    const fragment = {
        onLoad(date, entries) {
            this.entries = entries;
            this.backward = entries.length;
            this.date = date;
            Reflect.apply(this.handlers.arrive, this, [entries]);
        },
        onBackward(date, entries) {
            this.date = date;
            this.entries = this.entries.splice(
                ...[this.backward, 0].concat(entries));
            this.backward += entries.length;
            Reflect.apply(this.handlers.arrive, entries, []);
        }
    };
    
    // Basic Streamer: managed on arrivals (not ordered)
    // [init]
    // streamer = Streamer.Basic({href: "/streams/", ...});
    // streamer.load();
    // [event]
    // streamer.on("load", function (date, entries) {})
    // streamer.on("refresh", function (date, entries) {})
    // streamer.on("backward", function (date, entries) {})
    // [action]
    // streamer.refresh();
    // streamer.backward();
    const Basic = function Basic(opts) {
        opts = merge(opts, {
            selectors: {
                entries: "[rel=entry]",
                refresh: "[rel=refresh]",
                backward: "[rel=backward]",
                wait: "[rel=wait]"
            }
        });
        return Object.create(Basic.prototype, {
            opts: {value: opts},
            link: {value: {refresh: opts.href, backward: opts.href}},
            wait: {value: 500, writable: true},
            last: {value: new Date(0), writable: true},
            lane: {value: Promise.resolve(""), writable: true},
            handlers: {value: {
                load(date, entries) {},
                refresh(date, newEntries, oldEntries) {},
                backward(date, newEntries, oldEntries) {}
            }}
        });
    };
    Basic.prototype.on = function on(name, handler) {
        this.handlers[name] = handler;
    };
    Basic.prototype.action = function action(name) {
        return this[name].bind(this);
    };
    Basic.prototype.load = function load() {
        this.lane = this.lane.then(
            () => get(this.opts.href).then(basic.onLoad.bind(this)));
    };
    Basic.prototype.refresh = function refresh() {
        this.lane = this.lane.then(
            () => get(this.link.refresh).then(basic.onRefresh.bind(this)));
    };
    Basic.prototype.backward = function backward() {
        this.lane = this.lane.then(
            () => get(this.link.backward).then(basic.onBackward.bind(this)));
    };
    
    const basic = {
        onLoad(reqres) {
            const msg = Reflect.apply(basic.accept, this, [reqres]);
            Reflect.apply(this.handlers.load, this, [this.last, msg.entries]);
        },
        onRefresh(reqres) {
            const msg = Reflect.apply(basic.accept, this, [reqres]);
            Reflect.apply(this.handlers.refresh, this,
                          [this.last, msg.entries]);
        },
        onBackward(reqres) {
            const msg = Reflect.apply(basic.accept, this, [reqres]);
            Reflect.apply(this.handlers.backward, this,
                          [this.last, msg.entries]);
        },
        accept(reqres) {
            const modified = platform.responseHeader(reqres, "last-modified");
            const date = modified ? new Date(modified) : new Date();
            this.last = date;
            const msg = Reflect.apply(parseMessage, this, [reqres]);
            if (msg.refresh) this.link.refresh = msg.refresh.href;
            if (msg.backward) this.link.backward = msg.backward.href;
            return msg;
        }
    };
    
    const parseMessage = function parseMessage(reqres) {
        const doc = platform.createHtml(reqres);
        return {
            entries: Array.from(
                doc.querySelectorAll(this.opts.selectors.entries)),
            refresh: doc.querySelector(this.opts.selectors.refresh),
            backward: doc.querySelector(this.opts.selectors.backward)
        };
    };
    
    const get = (uri) => platform.get(uri);

    //NOTE: like ES6 Object.assign but with deep copy
    const merge = function merge(base, support) {
        if (base === undefined) return clone(support);
        if (support === undefined) return clone(base);
        if (base === null || typeof base !== "object") return base;
        if (support === null || typeof support !== "object") return support;
        const merged = {};
        Object.keys(support).forEach(key => {
            merged[key] = clone(support[key]);
        });
        Object.keys(base).forEach(key => {
            merged[key] = merge(base[key], merged[key]);
        });
        return merged;
    };
    const clone = function clone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = clone(obj[key]);
        });
        return cloned;
    };
    const indexOf = (array, cond) => Array.from(array).findIndex(cond);
    
    // platforms
    const platforms = {
        browser: {
            responseHeader(reqres, key) {
                return reqres.getResponseHeader(key);
            },
            createHtml(reqres) {
                const document = window.document;
                const doc = document.implementation.createHTMLDocument("");
                doc.documentElement.innerHTML = reqres.responseText;
                const link = document.createElement("link");
                link.href = reqres.href;
                const base = doc.createElement("base");
                base.href = link.href;
                doc.head.appendChild(base);
                return doc;
            },
            get(uri) {
                return new Promise((f, r) => {
                    const req = new window.XMLHttpRequest();
                    req.href = uri;
                    req.addEventListener("load", () => f(req), false);
                    req.addEventListener(
                        "error", () => r(new Error(req.status)), false);
                    req.open("GET", uri, true);
                    req.setRequestHeader("cache-control", "no-cache");
                    req.send();
                });
            }
        },
        agent: {
            responseHeader(reqres, key) {
                const res = reqres[1];
                return res.headers[key];
            },
            createHtml(reqres) {
                const req = reqres[0], res = reqres[1];
                const document = window.document;
                const doc = document.implementation.createHTMLDocument("");
                doc.documentElement.innerHTML = res.text();
                const link = document.createElement("link");
                link.href = req.href;
                const base = doc.createElement("base");
                base.href = link.href;
                doc.head.appendChild(base);
                return doc;
            },
            get(uri) {
                const space = window.anatta.engine.space;
                const req = space.request("GET", uri, {
                    "cache-control": "no-cache"
                });
                return space.access(req).then(reqres => {
                    const req = reqres[0], res = reqres[1];
                    if (res.status[0] !== "2") throw new Error(res.statusText);
                    return [req, res];
                });
            }
        }
    };
    
    const platform = (function build() {
        if (typeof window === "object" && typeof window.anatta === "object" &&
            window.anatta.engine) {
            return platforms.agent;
        }
        return platforms.browser;
    })();
    
    return {Basic, Fragment, Chain, Linear};
});
