var jsdom = require("jsdom");


var bindEventTarget = function (target) {
    var listeners = {};
    
    var addEventListener = function (name, listener, capture) {
        if (!listener) return;
        name = name.toLowerCase();
        capture = !!capture;
        listeners[name] = listeners[name] || {true: [], false: []};
        var list = listeners[name][capture];
        for (var i = 0; i < list.length; i++) {
            if (list[i] === listener) return;
        }
        list.push(listeners);
    };
    var removeEventListener = function (name, listener, capture) {
        if (!listener) return;
        name = name.toLowerCase();
        capture = !!capture;
        if (!listeners[name]) return;
        var list = listeners[name][capture];
        for (var i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener) {
                list.splice(i, 1);
                return;
            }
        }
    };
    var dispatchEvent = function (event) {
        // returns false if cancelled (preventDefault() called)
        // returns true, then caller may spawn default operation
        if (!(event instanceof jsdom.dom.level3.events.Event)) {
            var ev = createEvent("Event");
            ev.initEvent(event.type, !!event.bubbles, !!event.cancelable);
            if (event.detail) ev.detail = event.detail;
            event = ev;
        }
        event.target = event.currentTarget = target;
        if (!listeners[event.type]) return true;
        var list = listeners[event.type][event.bubble];
        if (event.bubbles) {
            for (var i = 0; i < list.length; i++) {
                try {
                    list[i].call(target, event);
                    if (event._stopPropagation) break;
                } catch (err) {
                    console.log(err);
                }
            }
        } else {
            for (var i = list.length - 1; i >= 0; i--) {
                try {
                    list[i].call(target, event);
                    if (event._stopPropagation) break;
                } catch (err) {
                    console.log(err);
                }
            }
        }
        return !event._preventDefault;
    };
    
    target.addEventListener = addEventListener;
    target.removeEventListener = removeEventListener;
    target.dispatchEvent = dispatchEvent;
    return target;
};

var createEvent = function (eventName) {
    return new jsdom.dom.level3.events[eventName];
};

exports.bindEventTarget = bindEventTarget;
exports.createEvent = createEvent
