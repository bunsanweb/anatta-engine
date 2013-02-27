"use strict";

var LockerAuth = (function () {
    var scheme = "LockerAuth";
    var challenge = {
        alg: "sha256",
        buf: "this is LockerAuth",
        bufEncoding: "utf8",
        signEncoding: "hex"
    };

    var parse = function (text) {
        if (!text) return {scheme: "", param: ""};
        var index = text.indexOf(" ");
        var scheme = text.slice(0, index).trim();
        var param = {};
        text.slice(index).split(",").forEach(function (elem) {
            var elems = elem.split("=");
            param[elems[0].trim()] = elems[1].trim().slice(1, -1);
        }); 
        return {scheme: scheme, param: param};
    };  

    var format = function (param) {
        if (!param|| param.error) return "";
        var str = "";
        Object.keys(param).forEach(function (key) {
            str += key + '="' + param[key] + '", ';
        }); 
        return scheme + " " + str.slice(0, -2);
    };  

    return {
        scheme: scheme,
        challenge: challenge,
        format: format,
        parse: parse,
        wwwAuthenticate: format(challenge)
    };
})();
