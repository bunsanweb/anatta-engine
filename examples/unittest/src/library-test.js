/*eslint prefer-arrow-callback: 0*/
/*global tap, join, get*/
"use strict";

// test example
tap.test("[sync ok] library.join", function test() {
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
tap.test("[async ok] library.get", function test(done) {
    this.timeout = 5000; // update timeout wait by each test
    tap.ok(get);
    get("http://example.org/").then(entity => {
        tap.ok(entity);
        tap.equal(entity.request.href, "http://example.org/");
    }).then(done, done);
});

// failure case of test
tap.test("[sync fail] raise error", function test() {
    throw new Error("fail");
});

// failure case of async test
tap.test("[async fail] raise error in function", function test(done) {
    this.timeout = 5000; // update timeout wait by each test
    get("http://example.org/").then(entity => {
        throw new Error("fail");
    }).then(done, done);
});

// another async test example with returned a promise
tap.test("[another async ok] library.get", function test() {
    this.timeout = 5000; // update timeout wait by each test
    tap.ok(get);
    return get("http://example.org/").then(entity => {
        tap.ok(entity);
        tap.equal(entity.request.href, "http://example.org/");
    });
});

// failure case of async test with returned a promise
tap.test("[another async fail] library.get", function test() {
    this.timeout = 5000; // update timeout wait by each test
    return get("http://example.org/").then(entity => {
        tap.equal(entity.request.href, "http://example.com/");
    });
});


// self test
tap.suite("[tap.js]");
tap.test("[test of test] deepEqual", function test() {
    // deep eq
    tap.deepEqual({foo: "bar"}, {foo: "bar"});
    tap.throws(
        () => tap.notDeepEqual({foo: "bar"}, {foo: "bar"}),
        tap.AssertionError);
    
    // non deep eq
    tap.notDeepEqual({foo: "bar", buzz: "quux"}, {foo: "bar"});
    tap.throws(
        () => tap.deepEqual({foo: "bar", buzz: "quux"}, {foo: "bar"}),
        tap.AssertionError);
    tap.notDeepEqual({foo: "bar"}, {foo: "bar", buzz: "quux"});
    tap.throws(
        () => tap.deepEqual({foo: "bar"}, {foo: "bar", buzz: "quux"}),
        tap.AssertionError);
    
    // cyclic
    const a = {}, b = {};
    a.self = a; b.self = b;
    tap.deepEqual(a, b);
    b.z = 0;
    tap.notDeepEqual(a, b);
});
