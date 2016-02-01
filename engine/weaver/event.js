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
        for (let i = 0; i < list.length; i++) {
            if (list[i] === listener) return;
        }
        list.push(listener);
    };
    const removeEventListener = function (name, listener, capture) {
        if (!listener) return;
        name = name.toLowerCase();
        capture = !!capture;
        if (!listeners[name]) return;
        const list = listeners[name][capture];
        for (let i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener) {
                list.splice(i, 1);
                return;
            }
        }
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
        // see inside jsdom Event at lib/jsdom/level2/events.js
        event._target = event._currentTarget = target;
        if (!listeners[event.type]) return true;
        const list = listeners[event.type][event.bubbles];
        if (event.bubbles) {
            for (let i = 0; i < list.length; i++) {
                if (callHandler(list[i], target, event)) break;
            }
        } else {
            for (let i = list.length - 1; i >= 0; i--) {
                if (callHandler(list[i], target, event)) break;
            }
        }
        return !event._preventDefault;
    };
    
    target.addEventListener = addEventListener;
    target.removeEventListener = removeEventListener;
    target.dispatchEvent = dispatchEvent;
    return target;
};

const emptyHandlers = function () {
    const h = {};
    h[true] = [];
    h[false] = [];
    return h;
};

const callHandler = function  (handler, target, event) {
    try {
        const ret = handler.call(target, event);
        if (ret === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (event._stopPropagation) return true;
    } catch (err) {
        console.log(err);
    }
    return false;
};



const createEvent = function (eventName) {
    return factory.createEvent(eventName);
};

exports.bindEventTarget = bindEventTarget;
exports.createEvent = createEvent
