"use strict";

const url = require("url");
const builders = {};

const load = () => require("../anatta");
const engine = (json) => builders[json.type](json);


// build generic configuration
builders.generic = (function generic() {
    const factories = {
        web: (anatta, engine, opts) => anatta.space.web.WebField(opts),
        orb: (anatta, engine, opts) => anatta.orb.core.OrbField(opts),
        file: (anatta, engine, opts) => anatta.space.file.FileField(opts),
        data: (anatta, engine, opts) => anatta.space.data.DataField(opts),
        agent: (anatta, engine, opts) => {
            const field = anatta.weaver.core.AgentField(opts);
            field.agent.engine = engine;
            return field;
        },
        galaxy: (anatta, engine, opts) => {
            const field = anatta.galaxy.core.GalaxyField(opts);
            if (typeof opts.engine === "object") {
                field.engine = builder(opts.engine);
            } else if (opts.engine === undefined || opts.engine === "self") {
                field.engine = engine;
            }
            return field;
        }
    };
    
    function builder(json) {
        json = json || {};
        const anatta = load();
        const engine = anatta.engine.core.Engine(json.engine);
        
        const porter = json.porter || {};
        Object.keys(porter).forEach(contentType => {
            const name = porter[contentType];
            const format = anatta.metadata[name];
            engine.porter.map[contentType] = format;
        });
        
        const space = json.space || {};
        Object.keys(space).forEach(prefix => {
            const desc = space[prefix];
            const field = factories[desc.field](anatta, engine, desc);
            const id = `${desc.field}|${prefix}`;
            engine.space.manager.bind(id, prefix, field);
        });
        
        return engine;
    }
    
    return builder;
})();

// build from simpler config
builders.simple = (function simple() {
    const factories = {
        web: (anatta, engine, opts) => {
            const field = anatta.space.web.WebField();
            opts.forEach(prefix => {
                const id = `web|${prefix}`;
                engine.space.manager.bind(id, prefix, field);
            });
        },
        orb: (anatta, engine, opts) => {
            opts.forEach(prefix => {
                const id = `orb|${prefix}`;
                const field = anatta.orb.core.OrbField();
                engine.space.manager.bind(id, prefix, field);
            });
        },
        file: (anatta, engine, opts) => {
            Object.keys(opts).forEach(prefix => {
                const root = opts[prefix];
                const prefixObj = url.parse(prefix, true, true);
                const pathPrefix = prefixObj.path;
                const id = `file|${prefix}`;
                const field = anatta.space.file.FileField({
                    root, prefix: pathPrefix});
                engine.space.manager.bind(id, prefix, field);
            });
        },
        data: (anatta, engine, opts) => {
            opts.forEach(prefix => {
                const id = `data|${prefix}`;
                const field = anatta.space.data.DataField();
                engine.space.manager.bind(id, prefix, field);
            });
        },
        agent: (anatta, engine, opts) => {
            Object.keys(opts).forEach(prefix => {
                const uri = opts[prefix];
                const id = `agent|${prefix}`;
                const field = anatta.weaver.core.AgentField({uri});
                field.agent.engine = engine;
                engine.space.manager.bind(id, prefix, field);
            });
        },
        galaxy: (anatta, engine, opts) => {
            Object.keys(opts).forEach(prefix => {
                const subOpts = opts[prefix];
                const id = `galaxy|${prefix}`;
                if (typeof subOpts === "string") {
                    const field = anatta.galaxy.core.GalaxyField({
                        from: prefix, to: subOpts});
                    field.engine = engine;
                    engine.space.manager.bind(id, prefix, field);
                } else {
                    const field = anatta.galaxy.core.GalaxyField({
                        from: prefix, to: subOpts.to});
                    field.engine = builder(subOpts);
                    engine.space.manager.bind(id, prefix, field);
                }
            });
        }
    };
    
    function builder(json) {
        json = json || {};
        const anatta = load();
        const engine = anatta.engine.core.Engine(json.engine);
        
        const porter = json.porter || {};
        Object.keys(porter).forEach(contentType => {
            const name = porter[contentType];
            const format = anatta.metadata[name];
            engine.porter.map[contentType] = format;
        });
        
        const space = json.space || {};
        Object.keys(space).forEach(factory => {
            const opts = space[factory];
            factories[factory](anatta, engine, opts);
        });
        
        return engine;
    }
    
    return builder;
})();


exports.engine = engine;
