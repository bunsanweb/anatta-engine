/*eslint prefer-arrow-callback: 0, func-names: 0*/
/*global suite, test*/
"use strict";

const assert = require("assert");
const jsdom = require("jsdom/lib/old-api");

function createHTMLDocument() {
    return jsdom.jsdom("<!doctype html>", {
        virtualConsole: jsdom.createVirtualConsole().sendTo(console),
        features: {
            FetchExternalResources: false,
            ProcessExternalResources: false,
        }
    });
}

suite("[deps: jsdom]");
test("querySelector with escaped ids", function () {
    const doc = createHTMLDocument();
    const elems = doc.createElement("div");
    assert.ok(!elems.querySelector("#foo"));
    assert.throws(_ => {
        elems.querySelector("#foo-xxx.0fcd"); // SyntaxError at ".0"
    });
    
    const a = doc.createElement("span");
    a.id = "0foo.000";
    elems.appendChild(a);
    const aid = Array.from(
        a.id, ch => `\\${ch.charCodeAt(0).toString(16)} `).join("");
    //TBD: jsdom-9.4.0 yet fails the valid codes
    assert.ok(elems.querySelector(`#\\30 foo\\.000`) === a);
    assert.ok(elems.querySelector(`#${aid}`) === a);
});
