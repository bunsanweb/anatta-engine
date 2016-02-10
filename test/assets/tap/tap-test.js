"use strict";

// self test
tap.suite("[tap.js]");
tap.test("[test of test] deepEqual", () => {
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
    a.self = a, b.self = b;
    tap.deepEqual(a, b);
    b.z = 0;
    tap.notDeepEqual(a, b);
});
