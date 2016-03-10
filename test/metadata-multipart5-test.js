"use strict";

const assert = require("assert");
const zip = function* () {
    const its = Array.from(arguments, e => e[Symbol.iterator]());
    while (true) {
        const es = its.map(it => it.next());
        if (es.reduce((r, e) => r || e.done, false)) return;
        yield es.map(e => e.value);
    }
};

suite("[multipart encode5/decode5]");
test("encode5 and decode5", function () {
    const anatta = require("../anatta");
    
    const obj = {
        "usual1": "value1",
        "usual2": "value2",
        "multi": [
            {
                filename: "index.html",
                headers: {
                    "content-type": "text/html;charset=utf-8",
                },
                body: Buffer("<body><script src='script.js'></script></body>"),
            },
            {
                filename: "script.js",
                headers: {
                    "content-type": "text/javascript",
                },
                body: Buffer("document.write('Hello World');"),
            },
        ],
    };
    const msg = anatta.metadata.multipart.encode5(obj);
    //console.log(msg.headers["content-type"]);
    //console.log(msg.body.toString());
    const decoded = anatta.metadata.multipart.decode5(msg);
    //console.log(decoded);
    assert.equal(decoded["usual1"], obj["usual1"]);
    assert.equal(decoded["usual2"], obj["usual2"]);

    for (const [d, o] of zip(decoded["multi"], obj["multi"])) {
        assert.equal(d.filename, o.filename);
        assert.equal(d.body.toString(), o.body.toString());
        assert.equal(d.headers["content-type"], o.headers["content-type"]);
    }
});

test("encode5/decode5 with non-ascii utf-8 charset value", function () {
    const anatta = require("../anatta");
    const obj = {
        "usual1": "\u5728",
        "usual2": "value2",
        "multi": [
            {
                filename: "index.html",
                headers: {
                    "content-type": "text/html;charset=utf-8",
                },
                body: Buffer("<body><script src='script.js'></script></body>"),
            },
            {
                filename: "script.js",
                headers: {
                    "content-type": "text/javascript",
                },
                body: Buffer("document.write('\u5708');"),
            },
        ],
    };
    const msg = anatta.metadata.multipart.encode5(obj);
    //console.log(msg.headers["content-type"]);
    //console.log(msg.body.toString());
    const decoded = anatta.metadata.multipart.decode5(msg);
    //console.log(decoded);
    assert.equal(decoded["usual1"], obj["usual1"]);
    assert.equal(decoded["usual2"], obj["usual2"]);
    
    for (const [d, o] of zip(decoded["multi"], obj["multi"])) {
        assert.equal(d.filename, o.filename);
        assert.equal(d.body.toString(), o.body.toString());
        assert.equal(d.headers["content-type"], o.headers["content-type"]);
    }
});

test("encode5/decode5 with non-ascii utf-8 charset key", function () {
    const anatta = require("../anatta");
    
    const obj = {
        "\u5728": "value1",
        "usual2": "value2",
        "\u5708": [
            {
                filename: "index.html",
                headers: {
                    "content-type": "text/html;charset=utf-8",
                },
                body: Buffer("<body><script src='script.js'></script></body>"),
            },
            {
                filename: "script.js",
                headers: {
                    "content-type": "text/javascript",
                },
                body: Buffer("document.write('Hello World');"),
            },
        ],
    };
    const msg = anatta.metadata.multipart.encode5(obj);
    //console.log(msg.headers["content-type"]);
    //console.log(msg.body.toString());
    const decoded = anatta.metadata.multipart.decode5(msg);
    //console.log(decoded);
    assert.equal(decoded["\u5728"], obj["\u5728"]);
    assert.equal(decoded["usual2"], obj["usual2"]);
    
    for (const [d, o] of zip(decoded["\u5708"], obj["\u5708"])) {
        assert.equal(d.filename, o.filename);
        assert.equal(d.body.toString(), o.body.toString());
        assert.equal(d.headers["content-type"], o.headers["content-type"]);
    }
});

test("encode and decode with non-ascii filename", function () {
    const anatta = require("../anatta");
    
    const obj = {
        "usual1": "value1",
        "usual2": "value2",
        "single": {
            filename: "\u5728.txt",
            headers: {
                "content-type": "text/plain;charset=utf-8",
            },
            body: Buffer("Hello World!"),
        },
        "multi": [
            {
                filename: "\u5727.html",
                headers: {
                    "content-type": "text/html;charset=utf-8",
                },
                body: Buffer("<body><script src='script.js'></script></body>"),
            },
            {
                filename: "\u5708.js",
                headers: {
                    "content-type": "text/javascript",
                },
                body: Buffer("document.write('Hello World');"),
            },
        ],
    };
    const msg = anatta.metadata.multipart.encode(obj);
    //console.log(msg.headers["content-type"]);
    //console.log(msg.body.toString());
    const decoded = anatta.metadata.multipart.decode(msg);
    //console.log(decoded);
    assert.equal(decoded["usual1"], obj["usual1"]);
    assert.equal(decoded["usual2"], obj["usual2"]);
    
    assert.equal(decoded["single"].filename, obj["single"].filename);
    assert.equal(decoded["single"].body.toString(),
                 obj["single"].body.toString());
    assert.equal(decoded["single"].headers["content-type"],
                 obj["single"].headers["content-type"]);

    for (const [d, o] of zip(decoded["multi"], obj["multi"])) {
        assert.equal(d.filename, o.filename);
        assert.equal(d.body.toString(), o.body.toString());
        assert.equal(d.headers["content-type"], o.headers["content-type"]);
    }
});
