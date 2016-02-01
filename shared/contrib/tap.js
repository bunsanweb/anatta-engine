"use strict";

var tap = (function () {
    var q = anatta.q;
    var suites = {}; 
    
    var newSuite = function () {
        return {
            tests: {},
            context: {},
            timeout: 1000,
        };
    };
    var suite = suites[""] = newSuite();
    
    var formatTest = function (index, desc, name, value) {
        if (value instanceof Error) {
            var msg = "not ok " + (index + 1) + " - " + name + desc + "\n";
            value.stack.split("\n").forEach(function (line) {
                msg += "  " + line + "\n";
            });
            return {log: msg, success: 0, failure: 1};
        } else {
            var msg = "ok " + (index + 1) + " - " + name + desc + "\n";
            return {log: msg, success: 1, failure: 0};
        }
    };
    var formatResult = function (result) {
        var total = result.success + result.failure;
        var head = "1.." + total + "\n";
        var tail = "# tests " + total + "\n";
        tail += "# pass " + result.success + "\n";
        tail += "# fail " + result.failure + "\n";
        return head + result.log + tail;
    };
    
    var callTest = function (context, test, done) {
        try {
            if (test.length > 0) {
                test.call(context, done);
            } else {
                var promise = test.call(context);
                if (promise && typeof promise.then === "function") {
                    promise.then(done, done);
                } else {
                    done(promise);
                }
            }
        } catch (error) {
            done(error);
        }
    };
    
    var runTest = function (index, desc, name, test, suite) {
        var d = q.defer();
        var quit = false;
        var wait = suite.timeout;
        
        var done = function (value) {
            if (quit) return;
            quit = true;
            clearTimeout(tid);
            d.resolve(formatTest(index, desc, name, value));
        };
        var handleTimeout = function () {
            done(new Error("timeout"));
        };
        var tid = setTimeout(handleTimeout, wait);
        var context = Object.create(suite.context, {
            timeout: {
                get: function () {return wait;},
                set: function(ms) {
                    wait = ms;
                    clearTimeout(tid);
                    tid = setTimeout(handleTimeout, wait);
                },
            }
        });
        callTest(context, test, done);
        return d.promise;
    };
    
    var empty = function () {
        return {log: "", count: 0, success: 0, failure: 0};
    };
    var join = function (summary) {
        return function (result) {
            return {
                log: summary.log + result.log,
                success: summary.success + result.success,
                failure: summary.failure + result.failure,
            };
        };
    };
    
    var runSuites = function (suites) {
        var index = 0;
        var cur = q(empty());
        Object.keys(suites).forEach(function (name) {
            var suite = suites[name];
            Object.keys(suite.tests).forEach(function (desc) {
                var test = suite.tests[desc];
                var i = index;
                index += 1;
                cur = cur.then(function (summary) {
                    return runTest(i, desc, name, test, suite).then(
                        join(summary));
                });
            });
        });
        return cur.then(formatResult);
    };
    
    var getResult = function (ev) {
        if (ev.detail.request.method !== "GET") return;
        ev.detail.accept();
        runSuites(suites).then(function (result) {
            ev.detail.respond("200", {
                "content-type": "text/plain;charset=UTF-8",
            }, result);
        });
    };
    window.addEventListener("agent-access", getResult, false);
    
    // for assertion
    var deq = function deq(a, b, cache) {
        if (a == b) return true;
        if (typeof a !== "object" || typeof b !== "object") return a === b;
        if (a.prototype !== b.prototype) return false;
        cache = cache || [];
        if (cache.some(function (pair) {
            return pair.a === a && pair.b === b ||
                pair.a === b && pair.b === a;
        })) return true;
        cache.push({a: a, b: b});
        var ka = Object.keys(a), kb = Object.keys(b);
        if (!vaeq(ka, kb)) return false;
        return ka.every(function (name) {
            return deq(a[name], b[name], cache);
        });
    };
    var vaeq = function (a, b) {
        if (a.length !== b.length) return false;
        a.sort(), b.sort();
        return a.every(function (e, i) {
            return e == b[i];
        });
    };
    
    var AssertionError = function AssertionError(message, actual, expected) {
        this.message = message;
        this.actaual = actual;
        this.expected = expected;
        Error.captureStackTrace(this, AssertionError);
    };
    AssertionError.prototype = new Error();
    AssertionError.prototype.constructor = AssertionError;
    AssertionError.prototype.name = AssertionError.name;
    AssertionError.toString = function () {
        return "function AsserionError() {}";
    };
    
    return {
        suite: function (desc) {
            if (!suites[desc]) suites[desc] = newSuite();
            suite = suites[desc];
        },
        test: function (desc, func) {
            suite.tests[desc] = func;
        },
        // from CommonsJS Unit Testing/1.0
        AssertionError: AssertionError,
        ok: function (guard, message) {
            message = message || "guard not existed";
            if (!guard) throw new AssertionError(
                "[ok(guard)] " + message, guard, true);
        },
        equal: function (actual, expected, message) {
            message = message || actual + " != " + expected;
            if (actual != expected) throw new AssertionError(
                "[equal(actual, expected)] " + message, actual, expected);
            },
        notEqual: function (actual, expected, message) {
            message = message || actual + " == " + expected;
            if (actual == expected) throw new AssertionError(
                "[notEqual(actual, expected)] " + message), actual, expected;
        },
        strictEqual: function (actual, expected, message) {
            message = message || actual + " !== " + expected;
            if (actual !== expected) throw new AssertionError(
                "[strictEqual(actual, expected)] " + message,
                actual, expected);
        },
        notStrictEqual: function (actual, expected, message) {
            message = message || actual + " === " + expected;
            if (actual === expected) throw new AssertionError(
                "[notStrictEqual(actual, expected)] " + message,
                actual, expected);
        },
        deepEqual: function (actual, expected, message) {
            message = message || actual + " not deep equal " + expected;
            if (!deq(actual, expected)) throw new AssertionError(
                "[deepEqual(actual, expected)] " + message, actual, expected);
        },
        notDeepEqual: function (actual, expected, message) {
            message = message || actual + " deep equal " + expected;
            if (deq(actual, expected)) throw new AssertionError(
                "[notDeepEqual(actual, expected)] " + message,
                actual, expected);
        },
        throws: function (block, expected, message) {
            var actual = null;
            message = message || 
                (expected ? expected : "Error") + " not thrown";
            try {
                block.call();
            } catch (err) {
                if (!expected || err instanceof expected) return;
                actual = err;
            }
            throw new AssertionError(
                "[throws(block, expected)] " + message, actual, expected);
        },
    };
})();
