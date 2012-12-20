"use strict";

var querystring = require("querystring");

var multipart = require("../metadata/multipart");

var decode = function (message) {
    if (message.headers["content-type"] === 
        "application/x-www-form-urlencoded") {
        return querystring.parse(message.body.toString());
    }
    return multipart.decode(message);
};

exports.encode = multipart.encode;
exports.decode = decode;