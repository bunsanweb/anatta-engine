var jsdom = require("jsdom");


var bindEventTarget = function (target) {
    var listeners = {};
    
    var addEventListener = function (name, listener, capture) {
        if (!listener) return;
        name = name.toLowerCase();
        capture = !!capture;
        if (!listeners[name]) listeners[name] = emptyHandlers();
        var list = listeners[name][capture];
        for (var i = 0; i < list.length; i++) {
            if (list[i] === listener) return;
        }
        list.push(listener);
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
        var list = listeners[event.type][event.bubbles];
        if (event.bubbles) {
            for (var i = 0; i < list.length; i++) {
                if (callHandler(list[i], target, event)) break;
            }
        } else {
            for (var i = list.length - 1; i >= 0; i--) {
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

var emptyHandlers = function () {
    var h = {};
    h[true] = [];
    h[false] = [];
    return h;
};

var callHandler = function  (handler, target, event) {
    try {
        var ret = handler.call(target, event);
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



var createEvent = function (eventName) {
    return new jsdom.dom.level3.events[eventName];
};

exports.bindEventTarget = bindEventTarget;
exports.createEvent = createEvent
