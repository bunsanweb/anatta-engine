"use strict";

const url = require("url");
const vm = require("vm");
const jsdom = require("../metadata/jsdom");
const space = {
    core: require("../space/core")
};


const access = function (agent, request) {
    // request to agent-xxx event
    return new Promise((f, r) => {
        const event = agent.window.document.createEvent("CustomEvent");
        event.initCustomEvent("agent-access", false, true, {
            request: request,
            accept: () => {
                event.preventDefault();
                event.stopPropagation();
            },
            respond: (status, headers, body) => {
                const response = space.core.Response(status, headers, body);
                f([request, response]);
            }
        });
        if (agent.window.dispatchEvent(event)) {
            //NOTE: self doc as a default response
            if (request.method === "GET") {
                event.detail.respond("200", {
                    "content-type": "text/html;charset=utf-8"
                }, agent.window.document.documentElement.outerHTML);
            } else {
                event.detail.respond("405", {"allow": "GET"});
            }
        }
    });
};

// lifecycle
const init = function (agent) {
    const contentType = agent.entity.response.contentType().value;
    const document = contentType === "text/html" ?
              agent.entity.html : jsdom.createHTMLDocument("");
    agent.window = vm.createContext(document.defaultView);
    bindApi(agent);
    const scriptTags = agent.window.document.querySelectorAll("head script");
    return loadScripts(agent, scriptTags, 0);
};



const bindApi = (agent) => {
    const window = agent.window;
    window.XMLSerializer = jsdom.XMLSerializer;
    window.anatta = {
        builtin: {
            url: require("url"),
            path: require("path"),
            querystring: require("querystring")
        },
        engine: agent.engine,
        entity: agent.entity,
        termset: {
            desc: require("../termset/desc")
        },
        cipher: require("./cipher"),
        form: require("./form"),
        inst: require("./inst")
    };
};

const loadScripts = function loadScripts(agent, scriptTags, index) {
    // when all scripts executed
    if (index >= scriptTags.length) return scriptsLoaded(agent);
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

const runScript = (agent, code, uri) => {
    try {
        vm.createScript(code, uri).runInContext(agent.window);
    } catch (err) {
        // pass errors in user code
        // TBD: logging to engine
        console.log([uri, err]);
    }
};

const scriptsLoaded = (agent) => {
    const event = agent.window.document.createEvent("CustomEvent");
    event.initCustomEvent("agent-load", false, true, {});
    agent.window.dispatchEvent(event);
    return agent;
};


exports.init = init;
exports.access = access;
