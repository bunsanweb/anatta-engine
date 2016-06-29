/*global LockerAuth*/
"use strict";

const LockerAuth = (function () {
    const scheme = "LockerAuth";
    const challenge = {
        alg: "sha256",
        buf: "this is LockerAuth",
        bufEncoding: "utf8",
        signEncoding: "hex"
    };

    const parse = (text) => {
        if (!text) return {scheme: "", param: ""};
        const index = text.indexOf(" ");
        const scheme = text.slice(0, index).trim();
        const param = {};
        text.slice(index).split(",").forEach((elem) => {
            const elems = elem.split("=");
            param[elems[0].trim()] = elems[1].trim().slice(1, -1);
        });
        return {scheme, param};
    };

    const format = (param) => {
        if (!param || param.error) return "";
        const kv = Object.keys(param).map((key) => `${key}="${param[key]}"`);
        return `${scheme} ${kv.join(", ")}`;
    };

    return {
        scheme, challenge, format, parse, wwwAuthenticate: format(challenge)
    };
})();
