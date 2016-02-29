"use strict";

const jsdom = require("jsdom");
const factory = jsdom.jsdom();
const Event = factory.defaultView.Event;
const CustomEvent = factory.defaultView.CustomEvent;

const bindEventTarget = function (target) {
    const listeners = {};

    const listenerFinder = (listener, capture) => (cur) =>
              cur.capture === capture && cur.listener === listener;
    const addEventListener = function (eventname, listener, capture) {
        if (typeof listener !== "function") return;
        const name = eventname.toLowerCase();
        if (!listeners[name]) listeners[name] = [];
        const list = listeners[name];
        const finder = listenerFinder(listener, !!capture);
        const existed = list.find(finder);
        if (!existed) list.push({listener: listener, capture: !!capture});
    };
    const removeEventListener = function (eventname, listener, capture) {
        if (typeof listener !== "function") return;
        const name = eventname.toLowerCase();
        if (!listeners[name]) return;
        const list = listeners[name];
        const finder = listenerFinder(listener, !!capture);
        const index = list.findIndex(finder);
        if (index >= 0) list.splice(index, 1);
    };

    const dispatchEvent = function (event) {
        // returns false if cancelled (preventDefault() called)
        // returns true, then caller may spawn default operation
        if (!(event instanceof Event)) {
            const ctor = event.detail ? CustomEvent : Event;
            event = new ctor(event.type, event);
        }
        //NOTE: hack for access internal state of jsdom event object
        const internal = event[Object.getOwnPropertySymbols(event)[0]];
        internal.target = internal.currentTarget = target;
        if (!listeners[event.type]) return true;
        const list = listeners[event.type];
        for (let cur of list) callHandler(cur.listener, target, event);
        return !internal._canceledFlag;
    };
    
    target.addEventListener = addEventListener;
    target.removeEventListener = removeEventListener;
    target.dispatchEvent = dispatchEvent;
    return target;
};

const callHandler = (handler, target, event) => {
    try {
        const ret = handler.call(target, event);
        if (ret === false) {
            event.preventDefault();
            event.stopPropagation();
        }
    } catch (err) {
        console.log(err);
    }
};



const createEvent = function (eventName) {
    return factory.createEvent(eventName);
};

exports.bindEventTarget = bindEventTarget;
exports.createEvent = createEvent;
