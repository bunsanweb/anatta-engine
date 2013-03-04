"use strict";

// test example
tap.test("[sync ok] library.join", function () {
    tap.ok(join);
    tap.equal(join("http://example.org/", "index.html"),
              "http://example.org/index.html");
    tap.equal(join("http://example.org/sub/index.html", "/index.html"),
              "http://example.org/index.html");
});

// async test example with 1st parameter as exit function
//
// - success: done() or done("all not instanceof Error")
// - failure: done(Error("something instanceof Error")) or timeout
tap.test("[async ok] library.get", function (done) {
    this.timeout = 5000; // update timeout wait by each test
    tap.ok(get);
    get("http://example.org/").then(function (entity) {
        tap.ok(entity);
        tap.equal(entity.request.href, "http://www.iana.org/domains/example");
    }).then(done, done);
});

// failure case of test
tap.test("[sync fail] raise error", function () {
    throw new Error("fail");
});

// failure case of async test
tap.test("[async fail] raise error in function", function (done) {
    this.timeout = 5000; // update timeout wait by each test
    get("http://example.org/").then(function (entity) {
        throw new Error("fail");
    }).then(done, done);
});

// another async test example with returned a promise
tap.test("[another async ok] library.get", function () {
    this.timeout = 5000; // update timeout wait by each test
    tap.ok(get);
    return get("http://example.org/").then(function (entity) {
        tap.ok(entity);
        tap.equal(entity.request.href, "http://www.iana.org/domains/example");
    })
});

// failure case of async test with returned a promise
tap.test("[another async fail] library.get", function () {
    this.timeout = 5000; // update timeout wait by each test
    return get("http://example.org/").then(function (entity) {
        tap.equal(entity.request.href, "http://example.com/");
    });
});


// self test
tap.suite("[tap.js]");
tap.test("[test of test] deepEqual", function () {
    // deep eq
    tap.deepEqual({foo: "bar"}, {foo: "bar"});
    tap.throws(function () {
        tap.notDeepEqual({foo: "bar"}, {foo: "bar"});
    }, tap.AssertionError);
    
    // non deep eq
    tap.notDeepEqual({foo: "bar", buzz: "quux"}, {foo: "bar"});
    tap.throws(function () {
        tap.deepEqual({foo: "bar", buzz: "quux"}, {foo: "bar"});
    }, tap.AssertionError);
    tap.notDeepEqual({foo: "bar"}, {foo: "bar", buzz: "quux"});
    tap.throws(function () {
        tap.deepEqual({foo: "bar"}, {foo: "bar", buzz: "quux"});
    }, tap.AssertionError);
    
    // cyclic
    var a = {}, b = {};
    a.self = a, b.self = b;
    tap.deepEqual(a, b);
    b.z = 0;
    tap.notDeepEqual(a, b);
});
