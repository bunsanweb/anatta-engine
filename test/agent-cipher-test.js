"use strict";

const assert = require("assert");

suite("[Agent handling private/public key]");
test("encode with privateKey and decode", function (done) {
    const cipher = require("../engine/weaver/cipher");

    const userA = {};
    const userB = {};
    const server = {pubs: []};

    userA.priv = cipher.generate();
    userA.pub = cipher.load(userA.priv.getPublicPem());
    server.pubs.push(userA.pub);

    userB.priv = cipher.generate();
    userB.pub = cipher.load(userB.priv.getPublicPem());
    server.pubs.push(userB.pub);

    const info = {
        cipher: "aes192",
        encoding: "base64",
        data: "hello world!",
    };

    const encoded = userA.priv.encode(info);
    assert.equal(server.pubs[0].decode(encoded), info.data);
    assert.equal(server.pubs[1].decode(encoded), null);
    done();
});

test("encode with publicKey and decode", function (done) {
    const cipher = require("../engine/weaver/cipher");

    const userA = {};
    const userB = {};
    const server = {pubs: []};

    userA.priv = cipher.generate();
    userA.pub = cipher.load(userA.priv.getPublicPem());
    server.pubs.push(userA.pub);

    userB.priv = cipher.generate();
    userB.pub = cipher.load(userB.priv.getPublicPem());
    server.pubs.push(userB.pub);

    const info = {
        cipher: "aes192",
        encoding: "base64",
        data: "hello world!",
    };

    const encoded = server.pubs[1].encode(info);
    assert.equal(userA.priv.decode(encoded), null);
    assert.equal(userB.priv.decode(encoded), info.data);
    done();
});

test("sign with string and verify", function (done) {
    const cipher = require("../engine/weaver/cipher");

    const userA = {};
    const userB = {};
    const server = {pubs: []};

    userA.priv = cipher.generate();
    userA.pub = cipher.load(userA.priv.getPublicPem());
    server.pubs.push(userA.pub);

    userB.priv = cipher.generate();
    userB.pub = cipher.load(userB.priv.getPublicPem());
    server.pubs.push(userB.pub);

    const info = {
        alg: "sha256",
        buf: "hello world!",
        bufEncoding: "utf8",
        signEncoding: "base64",
    };

    const sign = userA.priv.sign(info);
    assert.strictEqual(server.pubs[0].verify(sign), true);
    assert.strictEqual(server.pubs[1].verify(sign), false);
    done();
});

test("sign with Buffer and verify", function (done) {
    const cipher = require("../engine/weaver/cipher");

    const userA = {};
    const userB = {};
    const server = {pubs: []};

    userA.priv = cipher.generate();
    userA.pub = cipher.load(userA.priv.getPublicPem());
    server.pubs.push(userA.pub);

    userB.priv = cipher.generate();
    userB.pub = cipher.load(userB.priv.getPublicPem());
    server.pubs.push(userB.pub);

    const info = {
        alg: "sha256",
        buf: Buffer.from("hello world!"),
        bufEncoding: undefined,
        signEncoding: "base64",
    };

    const sign = userA.priv.sign(info);
    assert.strictEqual(server.pubs[0].verify(sign), true);
    assert.strictEqual(server.pubs[1].verify(sign), false);
    done();
});

test("check kind of key", function (done) {
    const cipher = require("../engine/weaver/cipher");

    const priv = cipher.generate();
    const pub = cipher.load(priv.getPublicPem());

    assert.strictEqual(priv.isPrivateKey(), true);
    assert.strictEqual(priv.isPublicKey(), false);

    assert.strictEqual(pub.isPrivateKey(), false);
    assert.strictEqual(pub.isPublicKey(), true);
    done();
});

test("check kind of key with pem", function (done) {
    const cipher = require("../engine/weaver/cipher");

    const priv = cipher.generate();
    const pub = cipher.load(priv.getPublicPem());

    assert.strictEqual(cipher.isPrivateKeyPem("foo"), false);
    assert.strictEqual(cipher.isPublicKeyPem("bar"), false);

    assert.strictEqual(cipher.isPrivateKeyPem(priv.getPem()), true);
    assert.strictEqual(cipher.isPrivateKeyPem(pub.getPem()), false);

    assert.strictEqual(cipher.isPublicKeyPem(priv.getPem()), false);
    assert.strictEqual(cipher.isPublicKeyPem(pub.getPem()), true);
    done();
});
