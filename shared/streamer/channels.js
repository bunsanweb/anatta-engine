(function (root, factory) {
    if (typeof exports === "object") module.exports = factory;
    else root.StreamerChannels = factory(root);
})(this, function (window) {
    "use strict";
    
    // Streamer that provides single layer view of chain streamer
    var Linear = function Linear(opts) {
        var opts = merge(opts, {});
        var chain = Chain(opts);
        var self = Object.create(Linear.prototype, {
            opts: {value: opts},
            chain: {value: chain},
            layers: {value: []},
            entries: {value: [], writable: true},
            handlers: {value: {
                update: function (updateEntries, positionEntry, isBackward) {},
            }},
        });
        // chain event handling
        chain.on("arrive", linear.arrive.bind(self));
        return self;
    };
    Linear.prototype.on = function (name, handler) {
        this.handlers[name] = handler;
    };
    Linear.prototype.action = function (name) {
        return this[name].bind(this);
    };
    Linear.prototype.load = function () {
        return this.chain.load();
    };
    Linear.prototype.refresh = function () {
        return this.chain.refresh();
    };
    Linear.prototype.backward = function () {
        return this.chain.backward();
    };
    var linear = {
        arrive: function (layerIndex, entries, full) {
            var isBackward = !!this.layers[layerIndex];
            this.layers[layerIndex] = full;
            var old = this.entries;
            this.entries = linear.asList.call(this);
            // find pos that is the first overwrapped element in old entries
            // for each entries as entry:
            //     when !pos: col.appendChild(entry);
            //     when pos.id !== entry.id: col.insertBefore(entry, pos);
            //     when pos.id === entry.id: col.replaceChild(entry, pos);
            //     pos = entry.nextSibling;
            var pos = null;
            if (isBackward) {
                var index = indexOf(this.entries, function (e) {
                    return e.id === entries[0].id;
                });
                pos = index >= 0 ? old[index] : null;
            } else {
                pos = old.length > 0 ?  old[0] : null;
            }
            this.handlers.update.call(this, entries, pos, isBackward);
        },
        asList: function () {
            if (this.layers.length === 0) return [];
            var ret = this.layers[this.layers.length - 1];
            for (var index = this.layers.length - 2; index >= 0; index--) {
                var cur = this.layers[index];
                var head = cur.length;
                for (var i = 0; i < cur.length; i++) {
                    if (ret.some(function (e) {
                        return e.id === cur[i].id;
                    })) continue;
                    head = i;
                    break;
                }
                ret = ret.concat(cur.slice(head));
            }
            return ret;
        },
    };
    
    // Streamer that chained Fragment streamers
    var Chain = function Chain(opts) {
        var opts = merge(opts, {});
        var self = Object.create(Chain.prototype, {
            opts: {value: opts},
            fragments: {value: []},
            handlers: {value: {
                arrive: function (index, newEntries, fragmentEntries) {},
            }},
        });
        return self;
    };
    Chain.prototype.on = function (name, handler) {
        this.handlers[name] = handler;
    };
    Chain.prototype.action = function (name) {
        return this[name].bind(this);
    };
    Chain.prototype.load = function () {
        var first = Fragment(this.opts);
        this.fragments.push(first);
        chain.bindChain.call(this, first);
        first.load();
    };
    Chain.prototype.refresh = function () {
        this.fragments[this.fragments.length -  1].refresh();
    };
    Chain.prototype.backward = function () {
        this.fragments[this.fragments.length -  1].backward();
    };
    var chain = {
        bindChain: function (fragment) {
            var self = this;
            var refreshedOnce = false;
            var index = self.fragments.indexOf(fragment);
            fragment.on("arrive", function (entries) {
                self.handlers.arrive.call(
                    self, index, entries, fragment.entries);
            });
            fragment.on("refresh", function (fragment) {
                if (refreshedOnce) return;
                refreshedOnce = true;
                self.fragments.push(fragment);
                chain.bindChain.call(self, fragment);
                fragment.load();
            });
        },
    };
    
    // Streamer that cached but goes only backward
    // when refreshed, pass new Fragment streamer
    var Fragment = function Fragment(opts) {
        var opts = merge(opts, {});
        var basic = Basic(opts);
        var self = Object.create(Fragment.prototype, {
            opts: {value: opts},
            basic: {value: basic},
            entries: {value: [], writable: true},
            date: {value: new Date(0), writable: true},
            handlers: {value: {
                refresh: function (fragment) {},
                arrive: function (entries) {},
            }},
        });
        basic.on("load", fragment.onLoad.bind(self));
        basic.on("backward", fragment.onBackward.bind(self));
        return self;
    };
    Fragment.prototype.on = function (name, handler) {
        this.handlers[name] = handler;
    };
    Fragment.prototype.action = function (name) {
        return this[name].bind(this);
    };
    Fragment.prototype.load = function () {
        return this.basic.load();
    };
    Fragment.prototype.backward = function () {
        return this.basic.backward();
    };
    Fragment.prototype.refresh = function () {
        var uri = this.basic.link.refresh;
        var opts = merge({href: uri}, this.opts);
        this.handlers.refresh.call(this, Fragment(opts));
    };
    var fragment = {
        onLoad: function (date, entries) {
            this.entries = entries;
            this.backward = entries.length;
            this.date = date;
            this.handlers.arrive.call(this, entries);
        },
        onBackward: function (date, entries) {
            this.date = date;
            var before = this.entries[this.backward] || null;
            this.entries = this.entries.splice.apply(
                this.entries, [this.backward, 0].concat(entries));
            this.backward += entries.length;
            this.handlers.arrive.call(entries);
        },
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
    var Basic = function Basic(opts) {
        opts = merge(opts, {
            selectors: {
                entries: "[rel=entry]",
                refresh: "[rel=refresh]",
                backward: "[rel=backward]",
                wait: "[rel=wait]",
            },
        });
        return Object.create(Basic.prototype, {
            opts: {value: opts},
            link: {value: {refresh: opts.href, backward: opts.href}},
            wait: {value: 500, writable: true},
            last: {value: new Date(0), writable: true},
            lane: {value: platform.q.resolve(""), writable: true},
            handlers: {value: {
                load: function (date, entries) {},
                refresh: function (date, newEntries, oldEntries) {},
                backward: function (date, newEntries, oldEntries) {},
            }},
        });
    };
    Basic.prototype.on = function (name, handler) {
        this.handlers[name] = handler;
    };
    Basic.prototype.action = function (name) {
        return this[name].bind(this);
    };
    Basic.prototype.load = function () {
        this.lane = this.lane.then(function () {
            return get(this.opts.href).then(basic.onLoad.bind(this));
        }.bind(this));
    };
    Basic.prototype.refresh = function () {
        this.lane = this.lane.then(function () {
            return get(this.link.refresh).then(basic.onRefresh.bind(this));
        }.bind(this));
    };
    Basic.prototype.backward = function () {
        this.lane = this.lane.then(function () {
            return get(this.link.backward).then(basic.onBackward.bind(this));
        }.bind(this));
    };
    var basic = {
        onLoad: function (reqres) {
            var msg = basic.accept.call(this, reqres);
            this.handlers.load.call(this, this.last, msg.entries);
        },
        onRefresh: function (reqres) {
            var msg = basic.accept.call(this, reqres);
            this.handlers.refresh.call(this, this.last, msg.entries);
        },
        onBackward: function (reqres) {
            var msg = basic.accept.call(this, reqres);
            this.handlers.backward.call(this, this.last, msg.entries);
        },
        accept: function (reqres) {
            var modified = platform.responseHeader(reqres, "last-modified");
            var date = modified ? new Date(modified) : new Date();
            this.last = date;
            var msg = parseMessage.call(this, reqres);
            if (msg.refresh) this.link.refresh = msg.refresh.href;
            if (msg.backward) this.link.backward = msg.backward.href;
            return msg;
        },
    };
    
    var parseMessage = function (reqres) {
        var doc = platform.createHtml(reqres);
        return {
            entries: Array.prototype.slice.call(
                doc.querySelectorAll(this.opts.selectors.entries)),
            refresh: doc.querySelector(this.opts.selectors.refresh),
            backward: doc.querySelector(this.opts.selectors.backward),
        };
    };
    
    var get = function (uri) {
        return platform.get(uri);
    };
    
    var merge = function merge(base, support) {
        if (base === undefined) return clone(support);
        if (support === undefined) return clone(base);
        if (base === null || typeof base !== "object") return base;
        if (support === null || typeof support !== "object") return support;
        var merged = {};
        Object.keys(support).forEach(function (key) {
            merged[key] = clone(support[key]);
        });
        Object.keys(base).forEach(function (key) {
            merged[key] = merge(base[key], merged[key]);
        });
        return merged;
    };
    var clone = function clone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        var cloned = {};
        Object.keys(obj).forEach(function (key) {
            cloned[key] = clone(obj[key]);
        });
        return cloned;
    };
    var indexOf = function (array, cond) {
        for (var i = 0; i < array.length; i++) {
            if (cond(array[i])) return i;
        }
        return -1;
    };
    
    // platforms
    var platforms = {
        browser: {
            get q() {
                return window.Q;
            },
            responseHeader: function (reqres, key) {
                return reqres.getResponseHeader(key);
            },
            createHtml: function (reqres) {
                var document = window.document;
                var doc = document.implementation.createHTMLDocument("");
                doc.documentElement.innerHTML = reqres.responseText;
                var link = document.createElement("link");
                link.href = reqres.href;
                var base = doc.createElement("base");
                base.href = link.href;
                doc.head.appendChild(base);
                return doc;
            },
            get: function (uri) {
                var d = Q.defer();
                var req = new window.XMLHttpRequest();
                req.href = uri;
                req.addEventListener("load", function () {
                    d.resolve(req);
                }, false);
                req.addEventListener("error", function () {
                    d.reject(new Error(req.status));
                }, false);
                req.open("GET", uri, true);
                req.setRequestHeader("cache-control", "no-cache");
                req.send();
                return d.promise;
            },
        },
        agent: {
            get q() {
                return window.anatta.q;
            },
            responseHeader: function (reqres, key) {
                return res.headers[key];
            },
            createHtml: function (reqres) {
                var document = window.document;
                var req = reqres[0], res = reqres[1];
                var doc = document.implementation.createHTMLDocument("");
                doc.innerHTML = res.text();
                doc._URL = req.href;
                return doc;
            },
            get: function (uri) {
                var space = window.anatta.engine.space;
                var req = space.request("GET", uri, {
                    "cache-control": "no-cache",
                });
                return space.access(req).spread(function (req, res) {
                    if (res.status[0] !== "2") throw new Error(res.statusText);
                    return [req, res];
                });
            },
        },
    };
    
    var platform = (function () {
        if (typeof window === "object" && typeof window.anatta === "object" &&
            window.anatta.engine) {
            return platforms.agent;
        }
        return platforms.browser;
    })();
    
    return {
        Basic: Basic,
        Fragment: Fragment,
        Chain: Chain,
        Linear: Linear,
    };
});
