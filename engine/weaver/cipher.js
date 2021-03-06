"use strict";

const crypto = require("crypto");
const forge = require("node-forge");

// forge utilities
const isPublicKey = (forgeKey) =>
          forgeKey && !Reflect.getOwnPropertyDescriptor(forgeKey, "d");
const isPrivateKey = (forgeKey) => forgeKey && !isPublicKey(forgeKey);

const publicEncrypt = (forgeKey, buf, encoding) => {
    const raw = forge.util.decode64(buf.toString("base64"));
    const encrypted = forgeKey.encrypt(raw);
    const enc64 = forge.util.encode64(encrypted);
    return Buffer.from(enc64, "base64").toString(encoding);
};
const privateDecrypt = (forgeKey, str, encoding) => {
    const b64 = Buffer.from(str, encoding).toString("base64");
    const raw = forge.util.decode64(b64);
    const decrypted = forgeKey.decrypt(raw);
    const dec64 = forge.util.encode64(decrypted);
    return Buffer.from(dec64, "base64");
};
const privateEncrypt = (forgeKey, buf, encoding) => {
    const raw = forge.util.decode64(buf.toString("base64"));
    const encrypted = forge.pki.rsa.encrypt(raw, forgeKey, 1);
    const enc64 = forge.util.encode64(encrypted);
    return Buffer.from(enc64, "base64").toString(encoding);
};
const publicDecrypt = (forgeKey, str, encoding) => {
    const b64 = Buffer.from(str, encoding).toString("base64");
    const raw = forge.util.decode64(b64);
    const decrypted = forge.pki.rsa.decrypt(raw, forgeKey, true, true);
    const dec64 = forge.util.encode64(decrypted);
    return Buffer.from(dec64, "base64");
};

const hashAndSign = (forgeKey, alg, buf, encoding) => {
    const md = forge.md[alg].create().update(buf);
    const sign = forgeKey.sign(md);
    return Buffer.from(sign, "binary").toString(encoding);
};
const hashAndVerify = (forgeKey, alg, buf, signStr, encoding) => {
    const sign = Buffer.from(signStr, encoding).toString("binary");
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


const states = new WeakMap();
const Key = class Key {
    constructor(key) {states.set(this, {key});}
    get key() {return states.get(this).key;}
    isPrivateKey() {return isPrivateKey(this.key);}
    isPublicKey() {return isPublicKey(this.key);}
    getPem() {
        if (!this.key) return "";
        return keyToPem(this.key);
    }
    encode(info) {
        const encoding = info.encoding || "base64";
        const rawPass = crypto.randomBytes(info.size || 24);
        const iv = crypto.randomBytes(info.ivsize || 16);
        const encoder = crypto.createCipheriv(info.cipher, rawPass, iv);
        encoder.update(Buffer.from(info.data));
        const data = encoder.final(encoding);
        const pass = isPrivateKey(this.key) ?
              privateEncrypt(this.key, rawPass, encoding) :
              publicEncrypt(this.key, rawPass, encoding);
        const ivhex = iv.toString("hex");
        return {cipher: info.cipher, encoding, pass, ivhex, data};
    }
    decode(info) {
        const encoding = info.encoding || "base64";
        try {
            const rawPass = isPrivateKey(this.key) ?
                      privateDecrypt(this.key, info.pass, encoding) :
                      publicDecrypt(this.key, info.pass, encoding);
            const iv = Buffer.from(info.ivhex, "hex");
            const decoder = crypto.createDecipheriv(info.cipher, rawPass, iv);
            decoder.update(info.data, encoding);
            const data = decoder.final();
            return data;
        } catch (err) {
            return null;
        }
    }
};

const Private = class Private extends Key {
    static new(key) {return Object.freeze(new Private(key));}
    getPublicPem() {
        return forge.pki.publicKeyToPem(publicKeyFromPrivateKey(this.key));
    }
    sign(info) {
        info.alg = info.alg || "sha256";
        info.bufEncoding = info.bufEncoding || "utf8";
        info.signEncoding = info.signEncoding || "base64";
        try {
            const buf = Buffer.isBuffer(info.buf) ? info.buf :
                      Buffer.from(info.buf, info.bufEncoding);
            if (Buffer.isBuffer(info.buf)) info.buf = info.buf.toString();
            info.sign = hashAndSign(
                this.key, info.alg, buf, info.signEncoding);
        } catch (err) {
            info.error = err;
            info.sign = "";
        }
        return info;
    }
};

const Public = class Public extends Key {
    static new(key) {return Object.freeze(new Public(key));}
    verify(info) {
        const bufEncoding = info.bufEncoding || "utf8";
        const signEncoding = info.signEncoding || "base64";
        try {
            const buf = Buffer.isBuffer(info.buf) ? info.buf :
                      Buffer.from(info.buf, bufEncoding);
            return hashAndVerify(
                this.key, info.alg, buf, info.sign, signEncoding);
        } catch (err) {
            return false;
        }
    }
};


// exports
function generate(bits, exp) {
    bits = bits || 1024;
    exp = exp || 17;
    return new Private(forge.pki.rsa.generateKeyPair(bits, exp).privateKey);
}

function load(pem) {
    const key = keyFromPem(pem);
    if (isPrivateKey(key)) return Private.new(key);
    if (isPublicKey(key)) return Public.new(key);
    return null;
}

function isPrivateKeyPem(pem) {
    try {
        const key = load(pem);
        return key.isPrivateKey();
    } catch (err) {
        return false;
    }
}

function isPublicKeyPem(pem) {
    try {
        const key = load(pem);
        return key.isPublicKey();
    } catch (err) {
        return false;
    }
}

exports.generate = generate;
exports.load = load;
exports.isPrivateKeyPem = isPrivateKeyPem;
exports.isPublicKeyPem = isPublicKeyPem;
