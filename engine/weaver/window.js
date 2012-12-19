"use strict";

var url = require("url");
var vm = require("vm");
var q = require("q");
var jsdom = require("../metadata/jsdom");
var space = {
    core: require("../space/core"),
};
var weaver = {
    event: require("./event"),
};


var Window = function Window() {
    return vm.createContext(Object.create(Window.prototype, {}));
};

var bindApi = function (agent) {
    var window = agent.window;
    weaver.event.bindEventTarget(window);
    Object.defineProperty(window, "location", {get: function () {
        return url.parse(agent.entity.request.uri, false, true);
    }});
    window.XMLSerializer = jsdom.XMLSerializer;
    window.anatta = {
        builtin: {
            url: require("url"),
            path: require("path"),
            querystring: require("querystring"),
        },
        engine: agent.engine,
        form: require("./form"),
    };
    window.window = window;
    window.console = console;
};

var loaded = function (agent) {
    agent.window.dispatchEvent({type: "agent-load"});
    return agent;
};

var access = function (agent, request) {
    // request to agent-xxx event
    var d = q.defer();
    var event = weaver.event.createEvent("Event");
    event.initEvent("agent-access", false, true);
    event.detail = {
        request: request,
        accept: function () {
            event.preventDefault();
            event.stopPropagation();
        },
        respond: function (status, headers, body) {
            var response = space.core.Response(status, headers, body);
            d.resolve([request, response]);
        },
    }
    if (agent.window.dispatchEvent(event)) {
        //TBD: do default
        if (request.method === "GET") {
            event.detail.respond("200", {
                "content-type": "text/html;charset=utf-8"
            }, agent.window.document.outerHTML);
        } else {
            event.detail.respond("405", {"allow": "GET"});
        }
    }
    return d.promise;
};


// lifecycle
var init = function (agent) {
    bindApi(agent);
    if (agent.entity.response.contentType().value === "text/html") {
        agent.window.document = agent.entity.html;
    } else {
        agent.window.document = jsdom.createHTMLDocument("");
    }
    var scriptTags = agent.window.document.querySelectorAll("head script");
    return loadScripts(agent, scriptTags, 0);
};

var loadScripts = function loadScripts(agent, scriptTags, index) {
    // when all scripts executed
    if (index >= scriptTags.length) return loaded(agent);
    var scriptTag = scriptTags[index];
    if (!scriptTag.src) {
        // when embeded script
        var code = scriptTag.innerHTML;
        var uri = agent.entity.request.uri;
        runScript(agent, code, uri);
        return loadScripts(agent, scriptTags, index + 1);
    }
    // when linked script
    // TBD: use restricted space engine
    var scriptLink = agent.engine.link(scriptTag, "text/html", agent.entity);
    return scriptLink.get().then(function (entity) {
        var typeAttr = scriptTag.getAttribute("type");
        var type = typeAttr ? space.core.ContentType(typeAttr) :
            entity.response.contentType();
        if (type.value === "application/javascript" ||
            type.value === "text/javascript") {
            var charset = (scriptTag.getAttribute("charset") ||
                           type.parameter["charset"] || "utf-8");
            var code = entity.response.body.toString(charset);
            var uri = entity.request.uri;
            runScript(agent, code, uri);
        }
        return loadScripts(agent, scriptTags, index + 1);
    });
};

var runScript = function (agent, code, uri) {
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
