"use strict";

var assert = require("assert");

suite("[multipart encode/decode]");
test("encode and decode", function () {
    var anatta = require("../anatta");
    
    var obj = {
        "usual1": "value1",
        "usual2": "value2",
        "single": {
            filename: "hello.txt",
            headers: {
                "content-type": "text/plain;charset=utf-8",
            },
            body: Buffer("Hello World!"),
        },
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
    var msg = anatta.metadata.multipart.encode(obj);
    //console.log(msg.headers["content-type"]);
    //console.log(msg.body.toString());
    var decoded = anatta.metadata.multipart.decode(msg);
    //console.log(decoded);
    assert.equal(decoded["usual1"], obj["usual1"]);
    assert.equal(decoded["usual2"], obj["usual2"]);
    
    assert.equal(decoded["single"].filename, obj["single"].filename);
    assert.equal(decoded["single"].body.toString(),
                 obj["single"].body.toString());
    assert.equal(decoded["single"].headers["content-type"],
                 obj["single"].headers["content-type"]);

    for (var i = 0; i < 2; i++) {
        assert.equal(decoded["multi"][i].filename, obj["multi"][i].filename);
        assert.equal(decoded["multi"][i].body.toString(),
                     obj["multi"][i].body.toString());
        assert.equal(decoded["multi"][i].headers["content-type"],
                     obj["multi"][i].headers["content-type"]);
    }
});

test("with non-ascii utf-8 charset", function () {
    var anatta = require("../anatta");
    var obj = {
        "usual1": "\u5728",
        "usual2": "value2",
        "single": {
            filename: "hello.txt",
            headers: {
                "content-type": "text/plain;charset=utf-8",
            },
            body: Buffer("\u5727"),
        },
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
    var msg = anatta.metadata.multipart.encode(obj);
    //console.log(msg.headers["content-type"]);
    //console.log(msg.body.toString());
    var decoded = anatta.metadata.multipart.decode(msg);
    //console.log(decoded);
    assert.equal(decoded["usual1"], obj["usual1"]);
    assert.equal(decoded["usual2"], obj["usual2"]);
    
    assert.equal(decoded["single"].filename, obj["single"].filename);
    assert.equal(decoded["single"].body.toString(),
                 obj["single"].body.toString());
    assert.equal(decoded["single"].headers["content-type"],
                 obj["single"].headers["content-type"]);

    for (var i = 0; i < 2; i++) {
        assert.equal(decoded["multi"][i].filename, obj["multi"][i].filename);
        assert.equal(decoded["multi"][i].body.toString(),
                     obj["multi"][i].body.toString());
        assert.equal(decoded["multi"][i].headers["content-type"],
                     obj["multi"][i].headers["content-type"]);
    }
});
