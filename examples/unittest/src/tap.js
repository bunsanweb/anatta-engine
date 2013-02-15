var tap = (function () {
    var q = anatta.q;
    var tests = {};
    var timeout = 1000;
    
    var format = function (index, desc, value) {
        if (value instanceof Error) {
            var msg = "not ok " + (index + 1) + " " + desc + "\n";
            value.stack.split("\n").forEach(function (line) {
                msg += "    " + line + "\n";
            });
            return msg;
        } else return "ok " + (index + 1) + " " + desc + "\n";
    };
    
    var runTest = function (index, desc, test) {
        var d = q.defer();
        var quit = false;
        var done = function (value) {
            if (quit) return;
            quit = true;
            clearTimeout(tid);
            d.resolve(format(index, desc, value));
        };
        var tid = setTimeout(function () {
            done(new Error("timeout"));
        }, timeout);
        try {
            if (test.length > 0) {
                test(done);
            } else {
                test();
                done();
            }
        } catch (error) {
            done(error);
        }
        return d.promise;
    };
    
    var runTests = function (tests) {
        var descs = Object.keys(tests);
        var cur = q.resolve("1.." + descs.length + "\n");
        descs.forEach(function (desc, index) {
            var test = tests[desc];
            cur = cur.then(function (msg) {
                return runTest(index, desc, test).then(function (log) {
                    return msg + log;
                });
            });
        });
        return cur;
    };
    
    var getResult = function (ev) {
        if (ev.detail.request.method !== "GET") return;
        ev.detail.accept();
        runTests(tests).then(function (result) {
            ev.detail.respond("200", {
                "content-type": "text/plain;charset=UTF-8",
            }, result);
        });
    };
    window.addEventListener("agent-access", getResult, false);
    
    return {
        test: function (desc, func) {
            tests[desc] = func;
        },
        ok: function (obj, message) {
            message = message || "ok(object)";
            if (!obj) throw Error("[ok(object)] " + message + " not existed");
        },
        equal: function (actual, expected) {
            if (actual !== expected) throw Error(
                "[equal(actual, expected)] " + actual + " !== " + expected);
        },
    }
})();
