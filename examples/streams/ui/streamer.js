var Streamer = (function () {
    "use strict";
    
    // Streamer that provides single layer view of chain streamer
    var Linear = function Linear(opts) {
        var opts = merge(opts, {});
        var chain = Chain(opts);
        var self = Object.create(Chain.prototype, {
            opts: {value: opts},
            chain: {value: chain},
            layers: {value: []},
            handlers: {value: {
                update: function (currentEntries, oldEntries) {},
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
    var linear = {
        arrive: function (layerIndex, entries, full) {
            var old = linear.asList.call(this);
            this.laysers[layerIndex] = full;
            var current = linear.asList.call(this);
            // TBD: more detailed event
            this.handlers.update.call(this, current, old);
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
        chain.bindChain.call(this, first);
        this.fragments.push(first);
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
            fragment.on("arrive", function (entries) {
                var index = self.fragments.indexOf(fragment);
                self.handlers.arrive.call(
                    self, index, entries, fragment.entries);
            });
            fragment.on("refresh", function (fragment) {
                if (refreshedOnce) return;
                refreshedOnce = true;
                chain.bindChain.call(self, fragment);
                self.fragments.push(fragment);
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
        var opts = merge(this.opts, {uri: uri});
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
    // streamer = Streamer.Basic({uri: "/streams/", ...});
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
            link: {value: {refresh: opts.uri, backward: opts.uri}},
            wait: {value: 500, writable: true},
            last: {value: new Date(0), writable: true},
            lane: {value: Q.resolve(""), writable: true},
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
            return get(this.opts.uri).then(basic.onLoad.bind(this));
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
        onLoad: function (req) {
            var msg = basic.accept.call(this, req);
            this.handlers.load.call(this, this.last, msg.entries);
        },
        onRefresh: function (req) {
            var msg = basic.accept.call(this, req);
            this.handlers.refresh.call(this, this.last, msg.entries);
        },
        onBackward: function (req) {
            var msg = basic.accept.call(this, req);
            this.handlers.backward.call(this, this.last, msg.entries);
        },
        accept: function (req) {
            var modified = req.getResponseHeader("last-modified");
            var date = modified ? new Date(modified) : new Date();
            this.last = date;
            var msg = parseMessage.call(this, req);
            if (msg.refresh) this.link.refresh = msg.refresh.href;
            if (msg.backward) this.link.backward = msg.backward.href;
            return msg;
        },
    };
    
    var parseMessage = function (req) {
        var doc = createHtml(req);
        return {
            entries: Array.prototype.slice.call(
                doc.querySelectorAll(this.opts.selectors.entries)),
            refresh: doc.querySelector(this.opts.selectors.refresh),
            backward: doc.querySelector(this.opts.selectors.backward),
        };
    };
    
    var createHtml = function (req) {
        var doc = document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = req.responseText;
        var link = document.createElement("link");
        link.href = req.href;
        var base = doc.createElement("base");
        base.href = link.href;
        doc.head.appendChild(base);
        return doc;
    };
    
    var get = function (uri) {
        var d = Q.defer();
        var req = new XMLHttpRequest();
        req.href = uri;
        req.addEventListener("load", function () {
            d.resolve(req);
        }, false);
        req.addEventListener("error", function () {
            d.reject(new Error(req.status));
        }, false);
        req.open("GET", uri, true);
        req.send();
        return d.promise;
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
    
    return {
        Basic: Basic,
        Fragment: Fragment,
        Chain: Chain,
    };
})();
