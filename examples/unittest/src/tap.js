"use strict";

var tap = (function () {
    var q = anatta.q;
    var suite = {
        tests: {},
        context: {},
        timeout: 1000,
    };
    
    var format = function (index, desc, value) {
        if (value instanceof Error) {
            var msg = "not ok " + (index + 1) + " - " + desc + "\n";
            value.stack.split("\n").forEach(function (line) {
                msg += "  " + line + "\n";
            });
            return {log: msg, success: 0, failure: 1};
        } else {
            var msg = "ok " + (index + 1) + " - " + desc + "\n";
            return {log: msg, success: 1, failure: 0};
        }
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
    
    var runTest = function (index, desc, test, suite) {
        var d = q.defer();
        var quit = false;
        var wait = suite.timeout;
        
        var done = function (value) {
            if (quit) return;
            quit = true;
            clearTimeout(tid);
            d.resolve(format(index, desc, value));
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
    
    var runTests = function (suite) {
        var descs = Object.keys(suite.tests);
        var head = {log: "1.." + descs.length + "\n", success: 0, failure: 0};
        var join = function (summary) {
            return function (result) {
                return {log: summary.log + result.log,
                        success: summary.success + result.success,
                        failure: summary.failure + result.failure};
            };
        };
        return descs.reduce(function (prev, desc, index) {
            var test = suite.tests[desc];
            return prev.then(function (summary) {
                return runTest(index, desc, test, suite).then(join(summary));
            });
        }, q.resolve(head)).then(function (result) {
            return result.log +
                "# total success: " + result.success +
                ", total failure: " + result.failure + "\n";
        });
    };
    
    var getResult = function (ev) {
        if (ev.detail.request.method !== "GET") return;
        ev.detail.accept();
        runTests(suite).then(function (result) {
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
