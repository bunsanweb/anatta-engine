"use strict";

window.tap = (function build() {
    const suites = {};
    
    const newSuite = () => ({
        tests: {},
        context: {},
        timeout: 1000
    });
    
    let suite = suites[""] = newSuite();
    
    const formatTest = (index, desc, name, value) => {
        if (value instanceof Error) {
            const head = `not ok ${index + 1} - ${name}${desc}${"\n"}`;
            const body = value.stack.split("\n").map(
                line => `  ${line}${"\n"}`);
            return {log: `${head}${body}`, success: 0, failure: 1};
        }
        const msg = `ok ${index + 1} - ${name}${desc}${"\n"}`;
        return {log: msg, success: 1, failure: 0};
    };
    const formatResult = (result) => {
        const total = result.success + result.failure;
        const head = `1..${total}${"\n"}`;
        const tail = [
            `# tests ${total}${"\n"}`,
            `# pass ${result.success}${"\n"}`,
            `# fail ${result.failure}${"\n"}`].join("");
        return `${head}${result.log}${tail}`;
    };
    
    const callTest = (context, test, done) => {
        try {
            if (test.length > 0) {
                Reflect.apply(test, context, [done]);
            } else {
                const promise = Reflect.apply(test, context, []);
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
    
    const runTest = (index, desc, name, test, suite) => new Promise((f, r) => {
        let quit = false;
        let wait = suite.timeout;
        
        const done = (value) => {
            if (quit) return;
            quit = true;
            clearTimeout(tid);
            f(formatTest(index, desc, name, value));
        };
        const updateTimeout = () => setTimeout(
            () => done(new Error("timeout")), wait);
        
        let tid = updateTimeout();
        const context = Object.create(suite.context, {
            timeout: {
                get: () => wait,
                set: (ms) => {
                    wait = ms;
                    clearTimeout(tid);
                    tid = updateTimeout();
                }
            }
        });
        callTest(context, test, done);
    });
    
    const empty = () => ({log: "", count: 0, success: 0, failure: 0});
    
    const join = (summary) => result => ({
        log: summary.log + result.log,
        success: summary.success + result.success,
        failure: summary.failure + result.failure
    });

    
    const runSuites = (suites) => {
        let index = 0;
        let cur = Promise.resolve(empty());
        Object.keys(suites).forEach(name => {
            const suite = suites[name];
            Object.keys(suite.tests).forEach(desc => {
                const test = suite.tests[desc];
                const i = index;
                index += 1;
                cur = cur.then(
                    summary => runTest(i, desc, name, test, suite).then(
                        join(summary)));
            });
        });
        return cur.then(formatResult);
    };
    
    const getResult = (ev) => {
        if (ev.detail.request.method !== "GET") return;
        ev.detail.accept();
        runSuites(suites).then(result => {
            ev.detail.respond("200", {
                "content-type": "text/plain;charset=UTF-8"
            }, result);
        });
    };
    window.addEventListener("agent-access", getResult, false);
    
    // for assertion
    const deq = function deq(a, b, cache) {
        if (a === b) return true;
        if (typeof a !== "object" || typeof b !== "object") return a === b;
        if (a.prototype !== b.prototype) return false;
        cache = cache || [];
        if (cache.some(pair => pair.a === a && pair.b === b ||
                       pair.a === b && pair.b === a)) return true;
        cache.push({a, b});
        const ka = Object.keys(a), kb = Object.keys(b);
        if (!vaeq(ka, kb)) return false;
        return ka.every(name => deq(a[name], b[name], cache));
    };
    const vaeq = (a, b) => {
        if (a.length !== b.length) return false;
        a.sort(); b.sort();
        return a.every((e, i) => e === b[i]);
    };
    
    const AssertionError = function AssertionError(message, actual, expected) {
        this.message = message;
        this.actaual = actual;
        this.expected = expected;
        Error.captureStackTrace(this, AssertionError);
    };
    AssertionError.prototype = new Error();
    AssertionError.prototype.constructor = AssertionError;
    AssertionError.prototype.name = AssertionError.name;
    AssertionError.toString = () => "function AsserionError() {}";
    
    return {
        suite: (desc) => {
            if (!suites[desc]) suites[desc] = newSuite();
            suite = suites[desc];
        },
        test: (desc, func) => {suite.tests[desc] = func;},
        // from CommonsJS Unit Testing/1.0
        AssertionError,
        ok: (guard, message) => {
            message = message || "guard not existed";
            if (!guard) {
                throw new AssertionError(
                    `[ok(guard)] ${message}`, guard, true);
            }
        },
        equal: (actual, expected, message) => {
            message = message || `${actual} != ${expected}`;
            if (actual !== expected) {
                throw new AssertionError(
                    `[equal(actual, expected)] ${message}`, actual, expected);
            }
        },
        notEqual: (actual, expected, message) => {
            message = message || `${actual} == ${expected}`;
            if (actual === expected) {
                throw new AssertionError(
                    `[notEqual(actual, expected)] ${message}`,
                    actual, expected);
            }
        },
        strictEqual: (actual, expected, message) => {
            message = message || `${actual} !== ${expected}`;
            if (actual !== expected) {
                throw new AssertionError(
                    `[strictEqual(actual, expected)] ${message}`,
                    actual, expected);
            }
        },
        notStrictEqual: (actual, expected, message) => {
            message = message || `${actual} === ${expected}`;
            if (actual === expected) {
                throw new AssertionError(
                    `[notStrictEqual(actual, expected)] ${message}`,
                    actual, expected);
            }
        },
        deepEqual: (actual, expected, message) => {
            message = message || `${actual} not deep equal ${expected}`;
            if (!deq(actual, expected)) {
                throw new AssertionError(
                    `[deepEqual(actual, expected)] ${message}`,
                    actual, expected);
            }
        },
        notDeepEqual: (actual, expected, message) => {
            message = message || `${actual} deep equal ${expected}`;
            if (deq(actual, expected)) {
                throw new AssertionError(
                    `[notDeepEqual(actual, expected)] ${message}`,
                    actual, expected);
            }
        },
        throws: (block, expected, message) => {
            let actual = null;
            message = message ||
                `${expected ? expected : "Error"} not thrown`;
            try {
                Reflect.apply(block, null, []);
            } catch (err) {
                if (!expected || err instanceof expected) return;
                actual = err;
            }
            throw new AssertionError(
                `[throws(block, expected)] ${message}`, actual, expected);
        }
    };
})();
