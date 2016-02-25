"use strict";

const jsdom = require("jsdom");
const factory = jsdom.jsdom();
const Event = factory.createEvent("Event").constructor;

const bindEventTarget = function (target) {
    const listeners = {};

    const addEventListener = function (name, listener, capture) {
        if (!listener) return;
        name = name.toLowerCase();
        capture = !!capture;
        if (!listeners[name]) listeners[name] = emptyHandlers();
        const list = listeners[name][capture];
        if (!list.find(cur => cur === listener))
            capture ? list.unshift(listener) : list.push(listener);
    };
    const removeEventListener = function (name, listener, capture) {
        if (!listener) return;
        name = name.toLowerCase();
        capture = !!capture;
        if (!listeners[name]) return;
        const list = listeners[name][capture];
        const index = list.findIndex(cur => cur === listener);
        if (index >= 0) list.splice(index, 1);
    };

    const dispatchEvent = function (event) {
        // returns false if cancelled (preventDefault() called)
        // returns true, then caller may spawn default operation
        if (!(event instanceof Event)) {
            const ev = createEvent("Event");
            ev.initEvent(event.type, !!event.bubbles, !!event.cancelable);
            if (event.detail) ev.detail = event.detail;
            event = ev;
        }
        //NOTE: hack for access internal state of jsdom event object
        const internal = event[Object.getOwnPropertySymbols(event)[0]];
        internal.target = internal.currentTarget = target;
        if (!listeners[event.type]) return true;
        const list = listeners[event.type][event.bubbles];
        for (let cur of list) {
            if (callHandler(cur, target, event)) break;
        }
        return !internal._canceledFlag;
    };
    
    
    target.addEventListener = addEventListener;
    target.removeEventListener = removeEventListener;
    target.dispatchEvent = dispatchEvent;
    return target;
};

const emptyHandlers = () => {
    const h = {};
    h[true] = [];
    h[false] = [];
    return h;
};

const callHandler = (handler, target, event) => {
    try {
        const ret = handler.call(target, event);
        if (ret === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        //NOTE: hack for access internal state of jsdom event object
        const internal = event[Object.getOwnPropertySymbols(event)[0]];
        if (internal._stopPropagationFlag) return true;
    } catch (err) {
        console.log(err);
    }
    return false;
};



const createEvent = function (eventName) {
    return factory.createEvent(eventName);
};

exports.bindEventTarget = bindEventTarget;
exports.createEvent = createEvent;
