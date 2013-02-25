"use strict";

var crypto = require("crypto");
var ursa = require("ursa");

var Key = function (key) {
    return Object.create(Key.prototype, {
        key: {value: key}
    });
};
Key.prototype.isPrivateKey = function () {
    if (!this.key) return false;
    return ursa.isPrivateKey(this.key);
};
Key.prototype.isPublicKey = function () {
    if (!this.key) return false;
    return ursa.isPublicKey(this.key);
};
Key.prototype.getPem = function () {
    if (!this.key) return "";
    if (ursa.isPrivateKey(this.key)) {
        return this.key.toPrivatePem().toString();
    } else {
        return this.key.toPublicPem().toString();
    }
};
Key.prototype.encode = function (info) {
    var encoding = info.encoding || "base64";
    var rawPass = crypto.randomBytes(info.size || 64);
    var encoder = crypto.createCipher(info.cipher, rawPass);
    encoder.update(info.data);
    var data = encoder.final(encoding);
    var pass = "";
    if (ursa.isPrivateKey(this.key)) {
        pass = this.key.privateEncrypt(rawPass, "binary", encoding);
    } else {
        pass = this.key.encrypt(rawPass, "binary", encoding);
    }
    return {
        cipher: info.cipher,
        encoding: encoding,
        pass: pass,
        data: data
    };
};
Key.prototype.decode = function (info) {
    var encoding = info.encoding || "base64";
    try {
        var rawPass = "";
        if (ursa.isPrivateKey(this.key)) {
            rawPass = this.key.decrypt(info.pass, encoding, "binary");
        } else {
            rawPass = this.key.publicDecrypt(info.pass, encoding, "binary");
        }
        var decoder = crypto.createDecipher(info.cipher, rawPass);
        decoder.update(info.data, encoding);
        var data = decoder.final();
        return data;
    } catch (err) {
        return null;
    }
};

var Private = function (key) {
    return Object.create(Private.prototype, {
        key: {value: key}
    });
};
Private.prototype = Key();
Private.prototype.getPublicPem = function () {
    return this.key.toPublicPem().toString();
};
Private.prototype.sign = function (info) {
    info.alg = info.alg || "sha256";
    info.bufEncoding = info.bufEncoding || "utf8";
    info.signEncoding = info.signEncoding || "base64";
    try {
        var buf = info.buf;
        if (!Buffer.isBuffer(buf)) {
            buf = new Buffer(buf, info.bufEncoding);
        } else {
            info.buf = buf.toString();
        }
        info.sign = this.key.hashAndSign(
                info.alg, buf, undefined, info.signEncoding);
    } catch (err) {
        info.error = err;
        info.sign = "";
    }
    return info;
};

var Public = function (key) {
    return Object.create(Public.prototype, {
        key: {value: key}
    });
};
Public.prototype = Key();
Public.prototype.verify = function (info) {
    var bufEncoding = info.bufEncoding || "utf8";
    var signEncoding = info.signEncoding || "base64";
    try {
        var buf = info.buf;
        if (!Buffer.isBuffer(buf)) buf = new Buffer(buf, bufEncoding);
        return this.key.hashAndVerify(info.alg, buf, info.sign, signEncoding);
    } catch (err) {
        return false;
    }
};

var generate = function (bits, exp) {
    bits = bits || 1024;
    exp = exp || 17;
    return new Private(ursa.generatePrivateKey(bits, exp));
};

var load = function (pem) {
    var key = ursa.createKey(pem);
    if (ursa.isPrivateKey(key)) return new Private(key);
    if (ursa.isPublicKey(key)) return new Public(key);
};

var isPrivateKeyPem = function (pem) {
    try {
        var key = load(pem);
        return key.isPrivateKey();
    } catch (err) {
        return false;
    }
};

var isPublicKeyPem = function (pem) {
    try {
        var key = load(pem);
        return key.isPublicKey();
    } catch (err) {
        return false;
    }
};

exports.generate = generate;
exports.load = load;
exports.isPrivateKeyPem = isPrivateKeyPem;
exports.isPublicKeyPem = isPublicKeyPem;
