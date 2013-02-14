"use strict";

var url = require("url");

var load = function () {
    return require("../anatta");
}

var engine = function (json) {
    return builders[json.type](json);
};

var builders = {};

// build generic configuration
builders.generic = (function () {
    var factories = {
        web: function (anatta, engine, opts) {
            return anatta.space.web.WebField(opts);
        },
        orb: function (anatta, engine, opts) {
            return anatta.orb.core.OrbField(opts);
        },
        file: function (anatta, engine, opts) {
            return anatta.space.file.FileField(opts);
        },
        agent: function (anatta, engine, opts) {
            var field = anatta.weaver.core.AgentField(opts);
            field.engine = engine;
            return field;
        },
        galaxy: function (anatta, engine, opts) {
            var field = anatta.galaxy.core.GalaxyField(opts);
            field.engine = builder(opts.engine);
            return field;
        },
    };
    
    var builder = function (json) {
        json = json || {};
        var anatta = load();
        var engine = anatta.engine.core.Engine(json.engine);
        
        var porter = json.porter || {};
        Object.keys(porter).forEach(function (contentType) {
            var name = porter[contentType];
            var format = anatta.metadata[name];
            engine.porter.map[contentType] = format;
        });
        
        var space = json.space || {};
        Object.keys(space).forEach(function (prefix) {
            var desc = space[prefix];
            var field = factories[desc.field](anatta, engine, desc);
            var id = desc.field + "|" + prefix;
            engine.space.manager.bind(id, prefix, field);
        });
        
        return engine;
    };
    
    return builder;
})();

// build from simpler config
builders.simple = (function () {
    var factories = {
        web: function (anatta, engine, opts) {
            var field = anatta.space.web.WebField();
            opts.forEach(function (prefix) {
                var id = "web|" + prefix;
                engine.space.manager.bind(id, prefix, field);
            });
        },
        orb: function (anatta, engine, opts) {
            opts.forEach(function (prefix) {
                var id = "orb|" + prefix;
                var field = anatta.orb.core.OrbField();
                engine.space.manager.bind(id, prefix, field);
            });
        },
        file: function (anatta, engine, opts) {
            Object.keys(opts).forEach(function (prefix) {
                var root = opts[prefix];
                var prefixObj = url.parse(prefix, true, true);
                var pathPrefix = prefixObj.path;
                var id = "file|" + prefix;
                var field = anatta.space.file.FileField({
                    root: root, prefix: pathPrefix,
                });
                engine.space.manager.bind(id, prefix, field);
            });
        },
        agent: function (anatta, engine, opts) {
            Object.keys(opts).forEach(function (prefix) {
                var uri = opts[prefix];
                var id = "agent|" + prefix;
                var field = anatta.weaver.core.AgentField({uri: uri});
                field.engine = engine;
                engine.space.manager.bind(id, prefix, field);
            });
        },
        galaxy: function (anatta, engine, opts) {
            Object.keys(opts).forEach(function (prefix) {
                var subOpts = opts[prefix];
                var id = "galaxy|" + prefix;
                var field = anatta.galaxy.core.GalaxyField({
                    from: prefix, to: subOpts.to});
                field.engine = builder(subOpts);
                engine.space.manager.bind(id, prefix, field);
            });
        },
    };
    
    var builder = function (json) {
        json = json || {};
        var anatta = load();
        var engine = anatta.engine.core.Engine(json.engine);
        
        var porter = json.porter || {};
        Object.keys(porter).forEach(function (contentType) {
            var name = porter[contentType];
            var format = anatta.metadata[name];
            engine.porter.map[contentType] = format;
        });
        
        var space = json.space || {};
        Object.keys(space).forEach(function (factory) {
            var opts = space[factory];
            factories[factory](anatta, engine, opts);
        });
        
        return engine;
    };
    
    return builder;
})();


exports.engine = engine;
