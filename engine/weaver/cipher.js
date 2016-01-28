"use strict";

const crypto = require("crypto");
const forge = require("node-forge");

// forge utilities
const isPublicKey = (forgeKey) =>
          forgeKey && !Object.getOwnPropertyDescriptor(forgeKey, "d");
const isPrivateKey = (forgeKey) => forgeKey && !isPublicKey(forgeKey);

const publicEncrypt = (forgeKey, buf, encoding) => {
    const raw = buf.toString("binary");
    const encrypted = forgeKey.encrypt(raw);
    return Buffer(encrypted, "binary").toString(encoding);
};
const privateDecrypt = (forgeKey, str, encoding) => {
    const raw = Buffer(str, encoding).toString("binary");
    const decrypted = forgeKey.decrypt(raw);
    return Buffer(decrypted, "binary");
};
const privateEncrypt = (forgeKey, buf, encoding) => {
    const raw = buf.toString("binary");
    const encrypted = forge.pki.rsa.encrypt(raw, forgeKey, 1);
    return Buffer(encrypted, "binary").toString(encoding);
};
const publicDecrypt = (forgeKey, str, encoding) => {
    const raw = Buffer(str, encoding).toString("binary");
    const decrypted = forge.pki.rsa.decrypt(raw, forgekey, true, true);
    return Buffer(decrypted, "binary");
};

const hashAndSign = (forgeKey, alg, buf, encoding) => {
    const md = forge.md[alg].create().update(buf);
    const sign = forgeKey.sign(md);
    return Buffer(sign, "binary").toString(encoding);
};
const hashAndVerify = (forgeKey, alg, buf, signStr, encoding) => {
    const sign = Buffer(signStr, encoding).toString("binary");
    const md = forge.md[alg].create().update(buf);
    return forgeKey.verify(md.digest().bytes(), sign);
};

const publicKeyFromPrivateKey = (forgeKey) =>
          forge.pki.rsa.setPublicKey(forgeKey.n, forgeKey.e);
const keyToPem = (forgeKey) => isPrivateKey(forgeKey) ?
          forge.pki.privateKeyToPem(forgeKey) :
          forge.pki.publicKeyToPem(forgeKey);
const keyFromPem = (pem) => {
    const msg = forge.pem.decode(pem)[0];
    const obj = forge.asn1.fromDer(msg.body);
    if (msg.type === "PRIVATE KEY" || msg.type === "RSA PRIVATE KEY") {
        return forge.pki.privateKeyFromAsn1(obj);
    } else if (msg.type === "PUBLIC KEY" || msg.type === "RSA PUBLIC KEY") {
        return forge.pki.publicKeyFromAsn1(obj);
    }
    throw Error("The PEM data is not RSA Key");
};


const Key = function (key) {
    return Object.create(Key.prototype, {
        key: {value: key}
    });
};
Key.prototype.isPrivateKey = function () {
    return isPrivateKey(this.key);
};
Key.prototype.isPublicKey = function () {
    return isPublicKey(this.key);
};
Key.prototype.getPem = function () {
    if (!this.key) return "";
    return keyToPem(this.key);
};
Key.prototype.encode = function (info) {
    const encoding = info.encoding || "base64";
    const rawPass = crypto.randomBytes(info.size || 64);
    const encoder = crypto.createCipher(info.cipher, rawPass);
    encoder.update(Buffer(info.data));
    const data = encoder.final(encoding);
    const pass = isPrivateKey(this.key) ?
              privateEncrypt(this.key, rawPass, encoding) :
              publicEncrypt(this.key, rawPass, encoding);
    return {
        cipher: info.cipher,
        encoding: encoding,
        pass: pass,
        data: data
    };
};
Key.prototype.decode = function (info) {
    const encoding = info.encoding || "base64";
    try {
        const rawPass = isPrivateKey(this.key) ?
                  privateDecrypt(this.key, info.pass, encoding) :
                  publicDecrypt(this.key, info.pass, encoding);
        const decoder = crypto.createDecipher(info.cipher, rawPass);
        decoder.update(info.data, encoding);
        const data = decoder.final();
        return data;
    } catch (err) {
        return null;
    }
};


const Private = function (key) {
    return Object.create(Private.prototype, {
        key: {value: key}
    });
};
Private.prototype = Key();
Private.prototype.getPublicPem = function () {
    return forge.pki.publicKeyToPem(publicKeyFromPrivateKey(this.key));
};
Private.prototype.sign = function (info) {
    info.alg = info.alg || "sha256";
    info.bufEncoding = info.bufEncoding || "utf8";
    info.signEncoding = info.signEncoding || "base64";
    try {
        const buf = Buffer.isBuffer(info.buf) ? info.buf :
                  Buffer(info.buf, info.bufEncoding);
        if (Buffer.isBuffer(info.buf)) info.buf = info.buf.toString();
        info.sign = hashAndSign(this.key, info.alg, buf, info.signEncoding);
    } catch (err) {
        info.error = err;
        info.sign = "";
    }
    return info;
};

const Public = function (key) {
    return Object.create(Public.prototype, {
        key: {value: key}
    });
};
Public.prototype = Key();
Public.prototype.verify = function (info) {
    const bufEncoding = info.bufEncoding || "utf8";
    const signEncoding = info.signEncoding || "base64";
    try {
        const buf = Buffer.isBuffer(info.buf) ? info.buf :
                  Buffer(info.buf, bufEncoding);
        return hashAndVerify(this.key, info.alg, buf, info.sign, signEncoding);
    } catch (err) {
        return false;
    }
};

const generate = function (bits, exp) {
    bits = bits || 1024;
    exp = exp || 17;
    return new Private(forge.pki.rsa.generateKey(bits, exp));
};

const load = function (pem) {
    const key = keyFromPem(pem);
    if (isPrivateKey(key)) return new Private(key);
    if (isPublicKey(key)) return new Public(key);
};

const isPrivateKeyPem = function (pem) {
    try {
        const key = load(pem);
        return key.isPrivateKey();
    } catch (err) {
        return false;
    }
};

const isPublicKeyPem = function (pem) {
    try {
        const key = load(pem);
        return key.isPublicKey();
    } catch (err) {
        return false;
    }
};

exports.generate = generate;
exports.load = load;
exports.isPrivateKeyPem = isPrivateKeyPem;
exports.isPublicKeyPem = isPublicKeyPem;
