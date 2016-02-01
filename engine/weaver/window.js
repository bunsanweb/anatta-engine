"use strict";

const url = require("url");
const vm = require("vm");
const q = require("q");
const jsdom = require("../metadata/jsdom");
const space = {
    core: require("../space/core"),
};
const weaver = {
    event: require("./event"),
};


const Window = function Window() {
    return vm.createContext(Object.create(Window.prototype, {}));
};

const bindApi = function (agent) {
    const window = agent.window;
    weaver.event.bindEventTarget(window);
    Object.defineProperty(window, "location", {get: function () {
        return url.parse(agent.entity.request.href, false, true);
    }});
    window.XMLSerializer = jsdom.XMLSerializer;
    window.anatta = {
        builtin: {
            url: require("url"),
            path: require("path"),
            querystring: require("querystring"),
        },
        engine: agent.engine,
        entity: agent.entity,
        termset: {
            desc: require("../termset/desc"),
        },
        cipher: require("./cipher"),
        form: require("./form"),
        inst: require("./inst"),
        q: q,
    };
    window.window = window;
    // basic service
    window.console = console;
    window.setTimeout = setTimeout;
    window.clearTimeout = clearTimeout;
    window.setInterval = setInterval
    window.clearInterval = clearInterval;
    // Typed Array
    window.ArrayBuffer = ArrayBuffer;
    window.DataView = DataView;
    window.Int8Array = Int8Array;
    window.Int16Array = Int16Array;
    window.Int32Array = Int32Array;
    window.Uint8Array = Uint8Array;
    window.Uint8ClampedArray = Uint8ClampedArray;
    window.Uint16Array = Uint16Array;
    window.Uint32Array = Uint32Array;
    window.Float32Array = Float32Array;
    window.Float64Array = Float64Array;
};

const loaded = function (agent) {
    agent.window.dispatchEvent({type: "agent-load"});
    return agent;
};

const access = function (agent, request) {
    // request to agent-xxx event
    const d = q.defer();
    const event = weaver.event.createEvent("Event");
    event.initEvent("agent-access", false, true);
    event.detail = {
        request: request,
        accept: function () {
            event.preventDefault();
            event.stopPropagation();
        },
        respond: function (status, headers, body) {
            const response = space.core.Response(status, headers, body);
            d.resolve([request, response]);
        },
    };
    if (agent.window.dispatchEvent(event)) {
        //TBD: do default
        if (request.method === "GET") {
            event.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, agent.window.document.documentElement.outerHTML);
        } else {
            event.detail.respond("405", {"allow": "GET"});
        }
    }
    return d.promise;
};


// lifecycle
const init = function (agent) {
    bindApi(agent);
    if (agent.entity.response.contentType().value === "text/html") {
        agent.window.document = agent.entity.html;
    } else {
        agent.window.document = jsdom.createHTMLDocument("");
    }
    const scriptTags = agent.window.document.querySelectorAll("head script");
    return loadScripts(agent, scriptTags, 0);
};

const loadScripts = function loadScripts(agent, scriptTags, index) {
    // when all scripts executed
    if (index >= scriptTags.length) return loaded(agent);
    const scriptTag = scriptTags[index];
    if (!scriptTag.src) {
        // when embeded script
        const code = scriptTag.innerHTML;
        const uri = agent.entity.request.href;
        runScript(agent, code, uri);
        return loadScripts(agent, scriptTags, index + 1);
    }
    // when linked script
    // TBD: use restricted space engine
    const scriptLink = agent.engine.link(scriptTag, "text/html", agent.entity);
    return scriptLink.get().then(function (entity) {
        const typeAttr = scriptTag.getAttribute("type");
        const type = typeAttr ? space.core.ContentType(typeAttr) :
                  entity.response.contentType();
        if (type.value === "application/javascript" ||
            type.value === "text/javascript") {
            const charset = (scriptTag.getAttribute("charset") ||
                             type.parameter["charset"] || "utf-8");
            const code = entity.response.body.toString(charset);
            const uri = entity.request.href;
            runScript(agent, code, uri);
        }
        return loadScripts(agent, scriptTags, index + 1);
    });
};

const runScript = function (agent, code, uri) {
    try {
        vm.createScript(code, uri).runInContext(agent.window);
    } catch (err) {
        // pass errors in user code
        // TBD: logging to engine
        console.log([uri, err]);
    }
};


exports.Window = Window;
exports.init = init;
exports.access = access;
